import sumolib



def load_sumo_network(net_file):
    """Charge le réseau SUMO à partir d'un fichier .net.xml."""
    try:
        return sumolib.net.readNet(net_file)
    except Exception as e:
        print(f"Erreur : Impossible d'analyser le fichier '{net_file}' - {e}")
        return None