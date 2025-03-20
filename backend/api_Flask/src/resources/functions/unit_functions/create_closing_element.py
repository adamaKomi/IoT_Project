import xml.etree.ElementTree as ET

    
                
def create_closing_element(root, accident_id, lane_id, position, start_time, end_time, accident_type):
    """Crée un élément <closing> pour bloquer une voie."""
    return ET.SubElement(
        root,
        "closing",
        id=accident_id,
        lane=lane_id,
        startPos=str(position - 5),  # Bloquer 5m avant la position de l'accident
        endPos=str(position + 5),    # Bloquer 5m après la position de l'accident
        startTime=str(start_time),
        endTime=str(end_time),
        info=f"Accident de type {accident_type}"
    )
