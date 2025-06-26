require("dotenv").config(); // Charger les variables d'environnement depuis le fichier .env
const { MongoClient } = require("mongodb");

// URI de connexion à MongoDB
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.CONGESTION_DB_NAME || "congestion_db";

let client;
let db;

// Connexion à la base de données
async function connectDB() {
  try {
    if (!client) {
      client = new MongoClient(uri);
      await client.connect();
      console.log("✅ Connecté avec succès à MongoDB");
    }
    
    db = client.db(dbName);
    
    // Vérifier si des données existent dans la collection traffic_data
    const dataCount = await db.collection("congestion_data").countDocuments();
    console.log(`Nombre d'enregistrements dans congestion_data: ${dataCount}`);
    
    return db;
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB:", error);
    throw error;
  }
}

// Récupérer l'instance de la base de données
async function getDB() {
  if (!db) {
    await connectDB();
  }
  return db;
}

module.exports = { connectDB, getDB };
