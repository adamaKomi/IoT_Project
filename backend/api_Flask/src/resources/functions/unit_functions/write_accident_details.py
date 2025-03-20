import xml.etree.ElementTree as ET
import os

def write_accident_details(accident_details, accident_file):
    """Écrit les détails des accidents dans un fichier XML séparé."""
    details_root = ET.Element("accident_details")
    for acc_id, details in accident_details.items():
        accident_elem = ET.SubElement(details_root, "accident", id=acc_id)
        for key, value in details.items():
            ET.SubElement(accident_elem, key).text = str(value)
    details_tree = ET.ElementTree(details_root)
    accident_details_file = os.path.splitext(accident_file)[0] + "_details.xml"
    details_tree.write(accident_details_file, encoding="utf-8", xml_declaration=True)
    print(f"Fichier de détails d'accidents '{accident_details_file}' généré avec succès.")

