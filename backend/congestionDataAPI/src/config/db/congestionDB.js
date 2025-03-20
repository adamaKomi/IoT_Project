const {MongoClient} = require("mongodb");


const URI = "mongodb://127.0.0.1:27017";
const DB_NAME = "congestion_db";

let db;

const connect_congestionDB = async() =>{
    try {
        const client = await MongoClient.connect(URI,{useNewUrlParser: true, useUnifiedTopology: true});
        db = client.db(DB_NAME);
        console.log("✅ Connecté à la base de données congestion_db");
    } catch (error) {
        console.log("❌ Erreur de connexion à MongoDB :", error)
    }
}


const get_congestionDB = () =>{
    if(!db) throw new Error("❌ Base de données 'congestion_db' non connectée !");
    return db;
}

module.exports = {connect_congestionDB, get_congestionDB};