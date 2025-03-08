const { MongoClient } = require("mongodb");

const URI = "mongodb://127.0.0.1:27017";
const DB_NAME = "sumo_traffic";

let db;

async function connect_sumoTrafficDB() {
    try {
        const client = await MongoClient.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });
        db = client.db(DB_NAME);
        console.log("✅ Connecté à MongoDB");
    } catch (error) {
        console.error("❌ Erreur de connexion à MongoDB :", error);
    }
}

const get_sumoTrafficDB = () => {
    if (!db) throw new Error("❌ Base de données non connectée !");
    return db;
};

// Ajout d'une fonction pour fermer proprement la connexion
const close_sumoTrafficDB = async () => {
    if (db) {
        db = null;
        console.log("🔌 Connexion MongoDB fermée.");
    }
};

module.exports = { connect_sumoTrafficDB, get_sumoTrafficDB, close_sumoTrafficDB };
