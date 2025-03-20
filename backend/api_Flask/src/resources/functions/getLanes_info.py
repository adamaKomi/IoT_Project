import xml.etree.ElementTree as ET
import os
import json
import sumolib
from api_Flask.src.resources.functions.unit_functions.get_float_value import get_float_value

def getLanes_info(net_file="./sumo_files/map.net.xml", lanes_file="./sumo_files/lanes_info.json"):
    if not os.path.exists(net_file):
        print(f"Erreur : Le fichier '{net_file}' est introuvable.")
        return
    
    try:
        net = sumolib.net.readNet(net_file)
    except Exception as e:
        print(f"Erreur : Impossible d'analyser le fichier '{net_file}' - {e}")
        return
    
    try:
        root = ET.parse(net_file).getroot()
    except ET.ParseError:
        print(f"Erreur : Impossible d'analyser le fichier '{net_file}'.")
        return
    
    lanes_info = {}
    
    for edge in root.findall("edge"):
        edge_id = edge.get("id")
        if not edge_id:
            continue
        
        is_internal = edge.get("function") == "internal"
        
        for lane in edge.findall("lane"):
            lane_id = lane.get("id")
            lane_speed = get_float_value(lane, "speed")
            lane_length = get_float_value(lane, "length")
            lane_index = int(lane.get("index") or 0)
            lane_width = get_float_value(lane, "width") if get_float_value(lane, "width") is not None else 3.2
            
            lane_coordinates = ""
            
            if is_internal:
                shape_str = lane.get("shape")
                if not shape_str:
                    continue
                shape = [tuple(map(float, point.split(","))) for point in shape_str.split()]
            else:
                try:
                    edge_obj = net.getEdge(edge_id)
                    lane_obj = edge_obj.getLanes()[lane_index]
                    shape = lane_obj.getShape()
                except KeyError:
                    print(f"Erreur : L’arête '{edge_id}' n’est pas reconnue par sumolib")
                    continue
            
            for pos in [0, lane_length/4, lane_length/2, (lane_length*3)/4, lane_length]:
                try:
                    x, y = sumolib.geomhelper.positionAtShapeOffset(shape, pos)
                    lon, lat = net.convertXY2LonLat(x, y)
                    lane_coordinates += f"{lon},{lat} "
                except Exception as e:
                    print(f"Erreur lors de la conversion des coordonnées de {lane_id}: {e}")
                    lane_coordinates += "N/A "  # Placeholder si la conversion échoue
            
            if not lane_id or lane_length is None or lane_width is None:
                continue 
            
            laneInfos = {
                "lane_length": lane_length,
                "lane_width": lane_width,
                "lane_coordinates": lane_coordinates.strip()
            }
            lanes_info[lane_id] = laneInfos
    
    with open(lanes_file, "w", encoding="utf-8") as file:
        json.dump(lanes_info, file, indent=4)
    
    print(f"Infos des voies sauvegardées dans '{lanes_file}'.")                



if __name__ == "__main__":
    getLanes_info()