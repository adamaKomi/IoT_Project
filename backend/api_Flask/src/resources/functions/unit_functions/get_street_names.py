from resources.functions.unit_functions.get_one_street_name import get_one_street_name



def get_street_names(lanes):
    streets = {}
    for lane_id in lanes:
        street_name = get_one_street_name(lane_id)  
        if street_name:  # Vérifie si ce n'est pas une chaîne vide
            streets[lane_id] = street_name  # Ajoute au dictionnaire
    return streets
    
    