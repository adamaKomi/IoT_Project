# app/utils/sumo_helpers.py
import traci
import xml.etree.ElementTree as ET
import sumolib
import random
import os
from typing import Dict, List, Optional

def configure_simulation(sumo_config_path: str) -> List[str]:
    """Configure SUMO simulation command"""
    return [
        "sumo-gui",
        "-c", f"{sumo_config_path}/map.sumo.cfg",
        "--delay", "0",
        "--start",
        "--scale", "5",
        "--quit-on-end",  # pour fermer proprement
        "--no-internal-links",  # Ignore les liens internes
    ]

def get_street_names(lanes: List[str]) -> Dict[str, str]:
    """Get street names for lanes"""
    return {
        lane_id: traci.edge.getStreetName(lane_id.rsplit("_", 1)[0])
        for lane_id in lanes
        if traci.edge.getStreetName(lane_id.rsplit("_", 1)[0])
    }

def generate_route_file(net_file: str, rou_file: str, depart_max_time: int = 1000) -> None:
    """Generate SUMO route file with random vehicles"""
    if not os.path.exists(net_file):
        raise FileNotFoundError(f"Network file {net_file} not found")
    
    try:
        net = sumolib.net.readNet(net_file)
        edge_ids = [edge.getID() for edge in net.getEdges() 
                   if edge.allows("passenger") and not edge.getID().startswith(":")]
        
        if not edge_ids:
            raise ValueError("No valid edges found in network file")
        
        # Create XML structure
        root = ET.Element("routes")
        root.set("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
        root.set("xsi:noNamespaceSchemaLocation", "http://sumo.dlr.de/xsd/routes_file.xsd")
        
        # Define vehicle types
        vehicle_types = [
            {"id": "taxi", "length": "4.5", "minGap": "2.5"},
            {"id": "truck", "length": "10.0", "minGap": "3.0"},
            {"id": "motorcycle", "length": "2.0", "minGap": "1.0"}
        ]
        
        for vtype in vehicle_types:
            ET.SubElement(root, "vType", **vtype)
        
        # Add monitoring vehicle
        monitoring_vehicle = ET.SubElement(root, "vehicle", 
                                         id="monitoring_veh",
                                         depart="0",
                                         type="taxi")
        ET.SubElement(monitoring_vehicle, "route", edges=random.choice(edge_ids))
        
        # Add random vehicles
        for step in range(depart_max_time):
            for _ in range(random.randint(0, 20)):
                vehicle_id = f"veh_{step}_{random.randint(0, 1000)}"
                vehicle = ET.SubElement(root, "vehicle",
                                      id=vehicle_id,
                                      depart=str(step),
                                      type=random.choice(vehicle_types)["id"])
                ET.SubElement(vehicle, "route", edges=random.choice(edge_ids))
        
        # Write to file
        tree = ET.ElementTree(root)
        tree.write(rou_file, encoding="utf-8", xml_declaration=True)
        
    except Exception as e:
        raise RuntimeError(f"Error generating route file: {str(e)}")

def generate_sensors_file(net_file: str, sensors_file: str) -> None:
    """Generate SUMO sensors configuration file"""
    if not os.path.exists(net_file):
        raise FileNotFoundError(f"Network file {net_file} not found")
    
    try:
        tree = ET.parse(net_file)
        root = tree.getroot()
        new_root = ET.Element("additional")
        
        for edge in root.findall("edge"):
            edge_id = edge.get("id")
            if not edge_id:
                continue
            
            for lane in edge.findall("lane"):
                lane_id = lane.get("id")
                lane_length = lane.get("length")
                
                if not lane_id or not lane_length:
                    continue
                
                ET.SubElement(new_root, "laneAreaDetector",
                             id=lane_id,
                             lanes=lane_id,
                             pos="0",
                             endPos=lane_length,
                             friendlyPos="true",
                             period="60",
                             file="traffic_data.xml",
                             timeThreshold="2.0",
                             speedThreshold="5.0",
                             jamThreshold="75.0",
                             length=lane_length)
        
        tree = ET.ElementTree(new_root)
        tree.write(sensors_file, encoding="utf-8", xml_declaration=True)
        
    except Exception as e:
        raise RuntimeError(f"Error generating sensors file: {str(e)}")

def get_lane_info(net_file: str, lanes_file: str) -> None:
    """Extract lane information from network file"""
    # Implementation from your original getLanes_info function
    pass