def position_at_offset(shape, offset):
    """
    Calcule la position (x, y) à un décalage donné sur la forme de la voie.
    
    Args:
        shape: Liste de points (x, y) décrivant la forme de la voie.
        offset: Décalage sur la voie (en mètres).
    
    Returns:
        Un tuple (x, y) représentant la position sur la voie.
    """
    if not shape:
        raise ValueError("La forme de la voie est vide.")
    
    # Parcourir les segments de la voie pour trouver la position correspondante
    accumulated_length = 0.0
    for i in range(len(shape) - 1):
        x1, y1 = shape[i]
        x2, y2 = shape[i + 1]
        segment_length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
        
        if accumulated_length + segment_length >= offset:
            # Le décalage se trouve sur ce segment
            ratio = (offset - accumulated_length) / segment_length
            x = x1 + ratio * (x2 - x1)
            y = y1 + ratio * (y2 - y1)
            return x, y
        
        accumulated_length += segment_length
    
    # Si le décalage dépasse la longueur de la voie, retourner le dernier point
    return shape[-1]


