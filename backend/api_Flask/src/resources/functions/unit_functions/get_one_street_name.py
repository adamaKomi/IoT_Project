import traci


def get_one_street_name(lane_id):
    edge_id = lane_id.rsplit("_", 1)[0]
    return traci.edge.getStreetName(edge_id)
