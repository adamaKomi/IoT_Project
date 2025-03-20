from pymongo import MongoClient
import os
import time

# Utiliser une variable d'environnement pour l'URI MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://root:root@mongo:27017/sumo_traffic?authSource=admin")

# Fonction pour se connecter avec réessai
def connect_to_mongo(uri):
    max_retries = 10
    retry_count = 0
    while retry_count < max_retries:
        try:
            client = MongoClient(uri, serverSelectionTimeoutMS=5000)
            # Vérifie si le serveur est disponible
            client.server_info()
            print("Connexion à MongoDB réussie")
            return client
        except Exception as e:
            print(f"Échec de la connexion à MongoDB : {e}")
            retry_count += 1
            time.sleep(2)  # Attente de 2 secondes avant réessai
    raise Exception("Impossible de se connecter à MongoDB après plusieurs tentatives")

# Connexion à MongoDB
client = connect_to_mongo(MONGO_URI)
db = client["sumo_traffic"]

# Collection des données de la simulation du trafic
traffic_collection = db["traffic_data"]
# Assurer que lane_id est unique en créant un index unique
traffic_collection.create_index("lane_id", unique=True)

# Collection des données des accidents
accident_collection = db["accident_data"]
accident_collection.create_index("accident_id", unique=True)