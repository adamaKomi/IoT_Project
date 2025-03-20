import xml.etree.ElementTree as ET
import os
import sumolib
import random


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
        {"id": "taxi", "length": "4.5", "minGap": "2.5"},
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
        


if __name__ == "__main__":
    set_rou_file_content()