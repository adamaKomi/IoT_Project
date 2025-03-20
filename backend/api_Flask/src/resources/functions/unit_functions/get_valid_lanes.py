def get_valid_lanes(net):
    """Récupère les IDs des voies valides pour les accidents."""
    lanes = []
    for edge in net.getEdges():
        if edge.allows("passenger") and not edge.getID().startswith(":"):
            for lane in edge.getLanes():
                lanes.append(lane.getID())
    return lanes

