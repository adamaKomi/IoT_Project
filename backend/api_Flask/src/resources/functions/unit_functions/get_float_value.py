def get_float_value(element, attribute, default=None):
    """Tente de convertir un attribut XML en float, retourne default si None."""
    value = element.get(attribute)
    return float(value) if value is not None else default


if __name__ == "__main__":
    get_float_value()