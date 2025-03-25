import traci
import time
import sumolib
from pymongo import errors
import requests
from resources.functions.set_rou_file_content import set_rou_file_content
from resources.functions.generate_random_accidents import generate_random_accidents
from resources.functions.unit_functions.get_street_names import get_street_names
from resources.data.database import traffic_collection, accident_collection

# api de calcul des parametres de la congestion
url_api = 'http://127.0.0.1:5001/api/simulation-data'

        
        
def run_simulation(net_file="./sumo_files/map.net.xml", simulation_duration=1500):
    # ajouter les voitures
    set_rou_file_content("./sumo_files/map.net.xml", rou_file = "./sumo_files/map.rou.xml")
    
    
    # print(f"Accidents : {accident_details}")
    
    # Lancer la simulation avec SUMO-GUI
    sumoCmd = ["sumo-gui", "-c", "./sumo_files/map.sumo.cfg", "--delay", "0", "--start", "--scale", "5"]
    traci.start(sumoCmd)
    
    

    # Charger le réseau SUMO pour la conversion des coordonnées
    net = sumolib.net.readNet(net_file)
    # Récupération une seule fois des détecteurs
    lanes = traci.lanearea.getIDList()  
    
    
    # Les voies qui ont des noms de rue
    street_names = get_street_names(lanes)
    
    # informations sur les accidents
    accident_details = generate_random_accidents(street_names, net_file, "./sumo_files/accidents.add.xml", num_accidents=100, simulation_duration=1500)

    # vehicule personnel pour le suivie dans la circulation
    my_vehicule = "personal_vehicule"
    
    step = 0
    while  step < simulation_duration:
        # avancer la simulation
        traci.simulation.getMinExpectedNumber()
        traci.simulationStep()
        
      

        for lane_id in lanes:
            
            try:
                lane_length = traci.lanearea.getLength(lane_id)
                
                halting_number = traci.lanearea.getLastStepHaltingNumber(lane_id)

                max_speed = traci.lane.getMaxSpeed(lane_id)
                shape_xy = traci.lane.getShape(lane_id)
            
                # Conversion et inversion des coordonnées
                shape_geo = [(lat, lon) for lon, lat in [net.convertXY2LonLat(x, y) for x, y in shape_xy]]

                # informations sur les vehicules qui sont sur la section
                vehicle_ids = traci.lanearea.getLastStepVehicleIDs(lane_id)
                
                vehicules_infos = [{  # usage du 'list comprehension'
                        "vehicle_id": str(id),
                        "speed": traci.vehicle.getSpeed(id),
                        # "position": traci.vehicle.getPosition(id),
                        "length": traci.vehicle.getLength(id),
                        "minGap": traci.vehicle.getMinGap(id),
                        "type": traci.vehicle.getTypeID(id),
                    } for id in vehicle_ids
                ]
                    
                lane_accident = accident_details.get(lane_id, None)
                
                # Gestion des accidents
                if lane_accident is not None:
                    try:
                        # Convertir start_time et end_time en entiers
                        start_time = int(lane_accident["start_time"])
                        end_time = int(lane_accident["end_time"])
                        
                        # Vérifier si l'étape actuelle est dans l'intervalle de l'accident
                        if start_time <= step <= end_time:
                            try:
                                # sauvegarder l'accident dans la bd
                                accident_collection.insert_one(lane_accident)
                            except errors.DuplicateKeyError:
                                print("Cet accident existe déjà dans la base de données.")

                    except (KeyError, ValueError) as e:
                        print(f"Erreur lors de la gestion de l'accident pour la voie {lane_id}: {e}")

                # informations reccueillies par le capteur
                sensor_info = {
                    "lane_id": lane_id,  # Utilisation de lane_id comme clé unique
                    "timestamp": time.time(),
                    "lane_length": lane_length,
                    "vehicles": vehicules_infos,
                    "halting_number": halting_number,
                    "max_speed": max_speed,
                    "shape": shape_geo,
                }

                # Mise à jour ou insertion des données (remplace si lane_id existe)
                traffic_collection.update_one(
                    {"lane_id": lane_id},  # Condition : chercher par lane_id
                    {"$set": sensor_info},  # Mise à jour des valeurs
                    upsert=True  # Insère si lane_id n'existe pas encore
                )
                

            except Exception as e:
                print(f"Erreur lors de la récupération des données du capteur {lane_id}: {e}")
        
        # avancement de la simulation
        step +=1
        
        # Envoi de la requête POST à l'API à la fin de chaque itération
        donnees = {"start": True}
        try:
            response = requests.post(url_api, json=donnees)
            response.raise_for_status()  # Vérifie si la requête a réussi
            print(f"Réponse de l'API pour l'itération : {response.json()}")
        except requests.exceptions.HTTPError as http_err:
            print(f'Erreur HTTP pour l\'itération : {http_err}')
        except requests.exceptions.ConnectionError as conn_err:
            print(f'Erreur de connexion pour l\'itération : {conn_err}')
        except requests.exceptions.Timeout as timeout_err:
            print(f'Timeout pour l\'itération : {timeout_err}')
        except requests.exceptions.RequestException as req_err:
            print(f'Erreur lors de la requête pour l\'itération : {req_err}')
        


    # Fermer la simulation
    traci.close()


if __name__ == "__main__":
    run_simulation()