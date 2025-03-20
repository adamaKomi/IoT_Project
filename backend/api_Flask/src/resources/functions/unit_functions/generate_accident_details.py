import random
import time
from resources.functions.unit_functions.get_geo_coordinates import get_geo_coordinates

       
def generate_accident_details(lane_id, lane, lane_length, accident_types, simulation_duration, net):
    """Génère les détails d'un accident aléatoire, y compris les coordonnées géographiques."""
    position = random.uniform(0.1 * lane_length, 0.9 * lane_length)
    accident_type = random.choice(accident_types)
    max_duration = accident_type["duration"][1]
    start_time = random.randint(0, simulation_duration - max_duration)
    duration = random.randint(accident_type["duration"][0], accident_type["duration"][1])
    end_time = start_time + duration

    # Générer des nombres aléatoires de blessés et de morts
    injured = random.randint(accident_type["injured_range"][0], accident_type["injured_range"][1])
    fatalities = random.randint(accident_type["fatalities_range"][0], accident_type["fatalities_range"][1])

    # Obtenir les coordonnées géographiques
    lat, lon = get_geo_coordinates(lane, position, net)
    if lat is not None and lon is not None:
        print(f"Coordonnées géographiques de l'accident : ({lat}, {lon})")

    return {
        "accident_id": time.time(),
        "lane": lane_id,
        "position": position,
        "type": accident_type["name"],
        "start_time": start_time,
        "end_time": end_time,
        "duration": duration,
        "injured": injured,  # Nombre de blessés
        "fatalities": fatalities,  # Nombre de morts
        "latitude": lat,  # Latitude
        "longitude": lon  # Longitude
    }
    
    
    