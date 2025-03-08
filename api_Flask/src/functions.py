import xml.etree.ElementTree as ET
import os
import traci
import json
import time
import sumolib
from pymongo import MongoClient
import random
import requests

# Connexion à MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["sumo_traffic"]  # Nom de la base de données
collection = db["traffic_data"]  # Nom de la collection

# Assurer que lane_id est unique en créant un index unique
collection.create_index("lane_id", unique=True)


def get_float_value(element, attribute, default=None):
    """Tente de convertir un attribut XML en float, retourne default si None."""
    value = element.get(attribute)
    return float(value) if value is not None else default


def set_Sensors(net_file="../sumo_files/map.net.xml", sensors_file="../sumo_files/sensors.add.xml"):
    """Extrait les informations des voies du réseau SUMO et génère un fichier de capteurs."""

    # Vérifier si le fichier XML existe avant de le traiter
    if not os.path.exists(net_file):
        print(f"Erreur : Le fichier '{net_file}' est introuvable.")
        return

    # Charger le fichier XML du réseau SUMO
    try:
        tree = ET.parse(net_file)
        root = tree.getroot()
    except ET.ParseError:
        print(f"Erreur : Impossible d'analyser le fichier '{net_file}'.")
        return

    # Liste pour stocker les informations des voies
    lanes_info = []

    # Création d'un nouvel élément racine pour les détecteurs
    new_root = ET.Element("additional")

    # Parcourir tous les éléments "edge" dans le fichier map.net.xml
    for edge in root.findall("edge"):
        edge_id = edge.get("id")
        if not edge_id:
            continue  # S'assurer que l'edge a un ID valide

        # Parcourir toutes les voies associées à cet axe
        for lane in edge.findall("lane"):
            lane_id = lane.get("id")
            lane_speed = get_float_value(lane, "speed")
            lane_length = get_float_value(lane, "length")
            # lane_index = int(lane.get("index") or 0)  # Par défaut, index = 0 si non défini

            if not lane_id or lane_length is None:
                continue  # Éviter les entrées invalides

            # Stocker les informations de la voie
            lane_data = {
                "edge_id": edge_id,
                "lane_id": lane_id,
                "speed": lane_speed,
                "length": lane_length,
            }
            lanes_info.append(lane_data)

            # Créer un élément "laneAreaDetector" pour chaque voie
            ET.SubElement(
                new_root,
                "laneAreaDetector",
                id=lane_id,
                lanes=lane_id,
                pos="0",
                endPos=str(lane_length),  
                friendlyPos="true",
                period="60",
                file="traffic_data.xml",
                timeThreshold="2.0",
                speedThreshold="5.0",
                jamThreshold="75.0",
                length=str(lane_length),
            )

    # Écrire les résultats dans le fichier XML de sortie
    try:
        output_tree = ET.ElementTree(new_root)
        output_tree.write(sensors_file, encoding="utf-8", xml_declaration=True)
        print(f"Fichier '{sensors_file}' généré avec succès.")
    except Exception as e:
        print(f"Erreur lors de l'écriture du fichier '{sensors_file}': {e}")



def getLanes_info(net_file="../sumo_files/map.net.xml", lanes_file="../sumo_files/lanes_info.json"):
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


def set_rou_file_content(net_file="../sumo_files/map.net.xml", rou_file="../sumo_files/map.rou.xml", depart_max_time=1000):
    # Vérifier si le fichier net existe
    if not os.path.exists(net_file):
        print(f"Erreur : Le fichier '{net_file}' est introuvable.")
        return
    
    # Charger le réseau SUMO
    try:
        net = sumolib.net.readNet(net_file)
    except Exception as e:
        print(f"Erreur : Impossible d'analyser le fichier '{net_file}' - {e}")
        return
    
    # Charger le fichier XML pour récupérer les edges
    try:
        root = ET.parse(net_file).getroot()
    except ET.ParseError:
        print(f"Erreur : Impossible d'analyser le fichier '{net_file}'.")
        return
    
    # Récupérer les IDs des edges
    edge_ids = [edge.getID() for edge in net.getEdges() 
                if edge.allows("passenger") and not edge.getID().startswith(":")]
    if not edge_ids:
        print("Erreur : Aucun edge trouvé dans le fichier réseau.")
        return

    # Définition des types de véhicules
    vehicle_types = [
        {"id": "car", "length": "4.5", "minGap": "2.5"},
        {"id": "truck", "length": "10.0", "minGap": "3.0"},
        {"id": "motorcycle", "length": "2.0", "minGap": "1.0"}
    ]
    
    # Créer l'élément racine <routes>
    new_root = ET.Element("routes")
    new_root.set("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
    new_root.set("xsi:noNamespaceSchemaLocation", "http://sumo.dlr.de/xsd/routes_file.xsd")
    
    # Ajouter les types de véhicules <vType>
    for vtype in vehicle_types:
        ET.SubElement(
            new_root,
            "vType",
            id=vtype["id"],
            length=vtype["length"],
            minGap=vtype["minGap"]
        )
    
    # Compteur unique pour les IDs des véhicules
    vehicle_counter = 0
    
    # Générer les véhicules
    for indice in range(depart_max_time):
        nb_vehs = random.randint(0, 20)
        
        for i in range(nb_vehs):
            edge_id = random.choice(edge_ids)
            vehicle_type = random.choice(vehicle_types)  # Choix aléatoire du type de véhicule
            
            # Créer l'élément <vehicle> en se référant au vType défini
            vehicle = ET.SubElement(
                new_root,
                "vehicle",
                id=str(vehicle_counter),
                depart=str(indice),
                type=vehicle_type["id"]  # Utilisation du vType correspondant
            )
            
            # Ajouter l'élément <route> à l'intérieur de <vehicle>
            ET.SubElement(
                vehicle,
                "route",
                edges=edge_id
            )
            
            vehicle_counter += 1
    
    # Écrire les résultats dans le fichier XML de sortie
    try:
        output_tree = ET.ElementTree(new_root)
        output_tree.write(rou_file, encoding="utf-8", xml_declaration=True)
        print(f"Fichier '{rou_file}' généré avec succès.")
    except Exception as e:
        print(f"Erreur lors de l'écriture du fichier '{rou_file}': {e}")       
        
        
        
        
def start_simulation(net_file="../sumo_files/map.net.xml"):
    # ajouter les voitures
    set_rou_file_content()
    
    # Lancer la simulation avec SUMO-GUI
    sumoCmd = ["sumo-gui", "-c", "../sumo_files/map.sumo.cfg", "--delay", "0", "--start", "--scale", "5"]
    traci.start(sumoCmd)
    
    url_api = 'http://127.0.0.1:5000/api/simulation-data'

    # Charger le réseau SUMO pour la conversion des coordonnées
    net = sumolib.net.readNet(net_file)
    lanes = traci.lanearea.getIDList()  # Récupération une seule fois des détecteurs

    while traci.simulation.getMinExpectedNumber() > 0:
        traci.simulationStep()

        for lane_id in lanes:
            try:
                vehicle_count = traci.lanearea.getLastStepVehicleNumber(lane_id)
                mean_speed = traci.lanearea.getLastStepMeanSpeed(lane_id)
                occupancy = traci.lanearea.getLastStepOccupancy(lane_id)
                lane_length = traci.lanearea.getLength(lane_id)
                travel_time = lane_length / mean_speed if mean_speed > 0 else float('inf')
                
                halting_number = traci.lanearea.getLastStepHaltingNumber(lane_id)

                lane_width = traci.lane.getWidth(lane_id)
                max_speed = traci.lane.getMaxSpeed(lane_id)
                allowed_vehicles = traci.lane.getAllowed(lane_id)
                disallowed_vehicles = traci.lane.getDisallowed(lane_id)
                edge_id = traci.lane.getEdgeID(lane_id)
                link_indices = traci.lane.getLinks(lane_id)
                shape_xy = traci.lane.getShape(lane_id)

                # shape_geo = [net.convertXY2LonLat(x, y) for x, y in shape_xy]
                # Conversion et inversion des coordonnées
                shape_geo = [(lat, lon) for lon, lat in [net.convertXY2LonLat(x, y) for x, y in shape_xy]]
                density = vehicle_count / lane_length if lane_length > 0 else 0
                # informations sur les vehicules qui sont sur la section
                vehicle_ids = traci.lanearea.getLastStepVehicleIDs(lane_id)
                vehicules_infos = []
                veh_info = {}
                
                for id in vehicle_ids:
                    veh_info = {  # Nouveau dictionnaire créé à chaque itération
                        "vehicle_id": str(id),
                        "speed": traci.vehicle.getSpeed(id),
                        # "position": traci.vehicle.getPosition(id),
                        "length": traci.vehicle.getLength(id),
                        "minGap": traci.vehicle.getMinGap(id),
                        "type": traci.vehicle.getTypeID(id),
                    }
                    
                    # ajouter ce vehicule a la liste
                    vehicules_infos.append(veh_info)
                    
                sensor_info = {
                    "lane_id": lane_id,  # Utilisation de lane_id comme clé unique
                    "timestamp": time.time(),
                    # "vehicle_count": vehicle_count,
                    # "mean_speed": mean_speed,
                    # "occupancy": occupancy,
                    "lane_length": lane_length,
                    # "travel_time": travel_time,
                    "vehicles": vehicules_infos,
                    "halting_number": halting_number,
                    # "lane_width": lane_width,
                    "max_speed": max_speed,
                    # "allowed_vehicles": allowed_vehicles,
                    # "disallowed_vehicles": disallowed_vehicles,
                    # "edge_id": edge_id,
                    "shape": shape_geo,
                    # "links": link_indices,
                    # "density": density
                }

                # Mise à jour ou insertion des données (remplace si lane_id existe)
                collection.update_one(
                    {"lane_id": lane_id},  # Condition : chercher par lane_id
                    {"$set": sensor_info},  # Mise à jour des valeurs
                    upsert=True  # Insère si lane_id n'existe pas encore
                )

            except Exception as e:
                print(f"Erreur lors de la récupération des données du capteur {lane_id}: {e}")
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







# Exemple d'appel de la fonction
if __name__ == "__main__":
    set_Sensors()
    # getLanes_info()
    start_simulation()
