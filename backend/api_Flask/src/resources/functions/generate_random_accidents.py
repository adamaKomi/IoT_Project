import xml.etree.ElementTree as ET
import random
from resources.functions.unit_functions.check_file_exists import check_file_exists
from resources.functions.unit_functions.load_sumo_network import load_sumo_network
from resources.functions.unit_functions.get_valid_lanes import get_valid_lanes
from resources.functions.unit_functions.generate_accident_details import generate_accident_details
from resources.functions.unit_functions.create_closing_element import create_closing_element
from resources.functions.unit_functions.create_variable_speed_sign import create_variable_speed_sign
from resources.functions.unit_functions.write_accident_details import write_accident_details



def generate_random_accidents(street_names,
                            net_file="../sumo_files/map.net.xml", 
                            accident_file="../sumo_files/accidents.add.xml",
                            num_accidents=5,
                            simulation_duration=3600
                             ):
    """
    Génère un fichier XML contenant des accidents aléatoires pour la simulation SUMO.
    
    Args:
        net_file: Chemin vers le fichier réseau SUMO (.net.xml)
        accident_file: Chemin de sortie pour le fichier d'accidents
        rou_file: Chemin vers le fichier de routes (.rou.xml)
        num_accidents: Nombre d'accidents à générer
        simulation_duration: Durée totale de la simulation en secondes
    
    Returns:
        Un dictionnaire contenant les détails des accidents générés.
    """
    # Vérifier si le fichier réseau existe
    if not check_file_exists(net_file, "réseau SUMO"):
        print(f"Erreur : Le fichier réseau '{net_file}' est introuvable.")
        return None
    
    # Charger le réseau SUMO
    net = load_sumo_network(net_file)
    if not net:
        print(f"Erreur : Impossible de charger le réseau SUMO à partir de '{net_file}'.")
        return None
    
    # Récupérer les voies valides pour les accidents
    lanes = get_valid_lanes(net)
    if not lanes:
        print("Erreur : Aucune voie appropriée trouvée dans le réseau.")
        return None

    
    # Types d'accidents possibles
    accident_types = [
        {"name": "broken_car", "duration": (300, simulation_duration//2), "injured_range": (1, 3), "fatalities_range": (0, 1)}, 
        {"name": "major_accident", "duration": (600, simulation_duration-200), "injured_range": (3, 10), "fatalities_range": (1, 3)},  
        {"name": "minor_collision", "duration": (120, simulation_duration//4), "injured_range": (0, 2), "fatalities_range": (0, 0)}  
    ]
    
    # Dictionnaire pour stocker les détails des accidents
    accident_details = {}
    
    # Créer l'élément racine <additional> pour le fichier XML
    root = ET.Element("additional")
    
    # Générer les accidents aléatoires
    for i in range(num_accidents):
        # Sélectionner une voie aléatoire qui a un nom
        lane_id =""
        while(lane_id not in street_names.keys()):
            lane_id = random.choice(lanes)
        # print(f"Lane : {lane_id} --- street name : {street_names[lane_id]}")
        
        lane = net.getLane(lane_id)
        lane_length = lane.getLength()
        
        # Générer les détails de l'accident
        details = generate_accident_details(lane_id, lane, lane_length, accident_types, simulation_duration, net)
        accident_id = f"accident_{i}"
        
        # ajouter le nom de la rue
        details["on_street_name"] = street_names[lane_id]
        
        # Enregistrer les détails de l'accident
        accident_details[lane_id] = details
        
        # Créer un élément <closing> pour bloquer la voie
        create_closing_element(root, accident_id, lane_id, details["position"], details["start_time"], details["end_time"], details["type"])
        
        # Créer un élément <variableSpeedSign> pour réduire la vitesse autour de l'accident
        create_variable_speed_sign(root, accident_id, lane_id, details["start_time"], details["end_time"])
    
    # Écrire le résultat dans le fichier XML
    try:
        tree = ET.ElementTree(root)
        tree.write(accident_file, encoding="utf-8", xml_declaration=True)
        print(f"Fichier d'accidents '{accident_file}' généré avec succès.")
        
        # Enregistrer les détails des accidents dans un fichier séparé
        write_accident_details(accident_details, accident_file)
        print(f"Fichier de détails d'accidents '{accident_file}_details.xml' généré avec succès.")
        
        return accident_details
    except Exception as e:
        print(f"Erreur lors de l'écriture du fichier '{accident_file}': {e}")
        return None
    
        
  
  
  
                
if __name__ == "__main__":
    # from set_rou_file_content import set_rou_file_content
    # set_rou_file_content()
    
    accident_details = generate_random_accidents(num_accidents=10)
