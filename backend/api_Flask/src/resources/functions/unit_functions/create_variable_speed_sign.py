import xml.etree.ElementTree as ET




def create_variable_speed_sign(root, accident_id, lane_id, start_time, end_time):
    """Crée un élément <variableSpeedSign> pour réduire la vitesse autour de l'accident."""
    vss = ET.SubElement(
        root,
        "variableSpeedSign",
        id=f"vss_{accident_id}",
        lanes=lane_id
    )
    ET.SubElement(vss, "step", time=str(start_time), speed="5.0")  # Réduction à 5 m/s (~18 km/h)
    ET.SubElement(vss, "step", time=str(end_time), speed="-1.0")   # Retour à la vitesse par défaut

