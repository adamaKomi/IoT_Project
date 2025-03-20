import xml.etree.ElementTree as ET
import os
from api_Flask.src.resources.functions.unit_functions.get_float_value import get_float_value

def set_Sensors(net_file="./sumo_files/map.net.xml", sensors_file="./sumo_files/sensors.add.xml"):
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



if __name__ == "__main__":
    set_Sensors()