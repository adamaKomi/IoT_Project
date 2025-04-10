# app/services/simulation.py
import os
import traci
import time
import sumolib
from ..models.traffic import TrafficData
from ..utils.sumo_helpers import configure_simulation, get_street_names
import requests
import threading





class SimulationService:
    def __init__(self, config):
        self.config = config
        self.sumo_config_path = getattr(config, 'SUMO_CONFIG_PATH', 
                            os.path.join(os.path.dirname(__file__), '../../app/static/sumo_files'))
        self.api_url = getattr(config, 'API_URL', 'http://127.0.0.1:5001/api/simulation-data')
        self.simulation_running = False
        self.simulation_paused = False  # Nouvel état pour la pause
        self.simulation_thread = None
        self.traci_connection_active = False
        self.pause_event = threading.Event()  # Pour gérer la pause
        self.current_step = 0  # Pour suivre la progression
            
    def run_simulation(self, simulation_duration=1500):
        """Run the SUMO simulation and collect traffic data"""
        if self.simulation_running:
            return {"status": "error", "message": "Simulation already running"}
            
        if self.traci_connection_active:
            try:
                traci.close()
            except:
                pass
            self.traci_connection_active = False
            time.sleep(1)  # Petite pause
        
        # Start simulation in a separate thread
        self.simulation_running = True
        self.simulation_thread = threading.Thread(
            target=self._run_simulation_thread,
            args=(simulation_duration,)
        )
        self.simulation_thread.start()
        
        return {"status": "started", "message": "Simulation started successfully"}
    
    def pause_simulation(self):
        """Pause the running simulation"""
        if not self.simulation_running:
            return {"status": "error", "message": "No simulation is running"}
        if self.simulation_paused:
            return {"status": "error", "message": "Simulation already paused"}
            
        self.simulation_paused = True
        self.pause_event.set()  # Bloquer le thread
        return {"status": "paused", "message": "Simulation paused"}

    def resume_simulation(self):
        """Resume a paused simulation"""
        if not self.simulation_running:
            return {"status": "error", "message": "No simulation is running"}
        if not self.simulation_paused:
            return {"status": "error", "message": "Simulation is not paused"}
            
        self.simulation_paused = False
        self.pause_event.clear()  # Débloquer le thread
        return {"status": "resumed", "message": "Simulation resumed"}

    def _run_simulation_thread(self, simulation_duration):
        """Run simulation in a separate thread"""
        try:
            if self.traci_connection_active:
                traci.close()
                time.sleep(1)
                self.traci_connection_active = False

            sumo_cmd = configure_simulation(self.sumo_config_path)
            traci.start(sumo_cmd)
            self.traci_connection_active = True
            
            net = sumolib.net.readNet(f"{self.sumo_config_path}/map.net.xml")
            lanes = traci.lanearea.getIDList()
            street_names = get_street_names(lanes)
            
            for step in range(self.current_step, simulation_duration):
                if not self.simulation_running:
                    break
                    
                # Gestion de la pause
                if self.pause_event.is_set():
                    while self.pause_event.is_set() and self.simulation_running:
                        time.sleep(0.1)  # Attente active
                    if not self.simulation_running:
                        break
                
                traci.simulationStep()
                self.current_step = step  # Sauvegarde du pas actuel
                self._process_lane_data(net, lanes)
                self._notify_api(step)
                
        except Exception as e:
            print(f"Simulation error: {e}")
        finally:
            if self.traci_connection_active:
                try:
                    traci.close()
                except:
                    pass
            self.traci_connection_active = False
            self.simulation_running = False
            self.simulation_paused = False
            self.current_step = 0  # Réinitialisation
    
    def get_simulation_status(self):
        """Get current simulation status"""
        return {
            "running": self.simulation_running,
            "paused": self.simulation_paused,
            "traci_connected": self.traci_connection_active,
            "current_step": self.current_step,
            "thread_alive": self.simulation_thread.is_alive() if self.simulation_thread else False
        }
    
    def stop_simulation(self):
        """Stop the running simulation"""
        if not self.simulation_running:
            return {"status": "error", "message": "No simulation is running"}
            
        self.simulation_running = False
        self.simulation_paused = False
        self.pause_event.clear()  # Débloquer le thread si en pause
        
        if self.simulation_thread and self.simulation_thread.is_alive():
            self.simulation_thread.join(timeout=10)
            
        self.current_step = 0  # Réinitialiser le compteur
        return {"status": "stopped", "message": "Simulation stopped successfully"}
    
    def _process_lane_data(self, net, lanes):
        """Process and store data for each lane"""
        for lane_id in lanes:
            try:
                lane_data = self._collect_lane_data(net, lane_id)
                TrafficData.upsert_lane_data(lane_id, lane_data)
            except Exception as e:
                print(f"Error processing lane {lane_id}: {e}")
    
    def _collect_lane_data(self, net, lane_id):
        """Collect data for a single lane"""
        vehicle_ids = traci.lanearea.getLastStepVehicleIDs(lane_id)
        
        return {
            "lane_id": lane_id,
            "timestamp": time.time(),
            "lane_length": traci.lanearea.getLength(lane_id),
            "vehicles": self._get_vehicle_info(vehicle_ids),
            "halting_number": traci.lanearea.getLastStepHaltingNumber(lane_id),
            "max_speed": traci.lane.getMaxSpeed(lane_id),
            "shape": self._get_lane_shape(net, lane_id)
        }
    
    def _get_vehicle_info(self, vehicle_ids):
        return [{
            "vehicle_id": str(id),
            "speed": traci.vehicle.getSpeed(id),
            "length": traci.vehicle.getLength(id),
            "minGap": traci.vehicle.getMinGap(id),
            "type": traci.vehicle.getTypeID(id),
        } for id in vehicle_ids]
    
    def _get_lane_shape(self, net, lane_id):
        shape_xy = traci.lane.getShape(lane_id)
        return [(lat, lon) for lon, lat in [net.convertXY2LonLat(x, y) for x, y in shape_xy]]
    
    def _notify_api(self, step):
        """Notify external API about simulation progress"""
        try:
            response = requests.post(self.api_url, json={"step": step})
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"API notification error: {e}")