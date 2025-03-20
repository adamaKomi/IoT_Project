from  resources.functions.unit_functions.position_at_offset import position_at_offset

def get_geo_coordinates(lane, position, net):
    """
    Convertit une position sur une voie en coordonnées géographiques (latitude, longitude).
    
    Args:
        lane: Objet sumolib.net.lane.Lane représentant la voie.
        position: Position sur la voie (en mètres).
        net: Objet sumolib.net.Net représentant le réseau SUMO.
    
    Returns:
        Un tuple (latitude, longitude) ou None si la conversion échoue.
    """
    try:
        # Obtenir la forme de la voie (liste de points)
        shape = lane.getShape()
        
        # Calculer la position (x, y) sur la voie
        x, y = position_at_offset(shape, position)
        
        # Convertir les coordonnées x, y en latitude, longitude
        lon, lat = net.convertXY2LonLat(x, y)
        return lat, lon  # Retourne (latitude, longitude)
    except Exception as e:
        print(f"Erreur lors de la conversion des coordonnées : {e}")
        return None, None
    
   