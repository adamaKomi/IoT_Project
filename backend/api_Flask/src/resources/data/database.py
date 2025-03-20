from pymongo import MongoClient

# Connexion à MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["sumo_traffic"]  # Nom de la base de données

# collection des donnees de la simulation du traffic
traffic_collection = db["traffic_data"]  
# Assurer que lane_id est unique en créant un index unique
traffic_collection.create_index("lane_id", unique=True)




# collection des donnees des accidents
accident_collection = db["accident_data"]

accident_collection.create_index("accident_id", unique=True)




