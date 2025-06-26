// dotenv.config();
// Importer les modules nécessaires
require("dotenv").config();
const {MongoClient} = require("mongodb");


const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";

const DB_NAME = process.env.CONGESTION_DB_NAME || "congestion_db";


let db;

async function connect_congestionDB(){
    try {
            const client = await MongoClient.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });
            db = client.db(DB_NAME);
            console.log("✅ Connecté à MongoDB");
        } catch (err) {
            console.error("❌ Erreur de connexion à la base de données 'congestion_db' :", err);
        }
}


const get_congestionDB = () =>{
    if (!db) throw new Error("❌ Base de données 'congestion_db' non connectée !");
    return db;
}

module.exports = {connect_congestionDB, get_congestionDB};