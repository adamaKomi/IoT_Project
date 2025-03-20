const {get_congestionDB} = require("../config/db/congestionDB");


async function get_congestionData(req, res){
    try {
        const db = await get_congestionDB();

        if (!db) {
            throw new Error("❌ Base de données non connectée !");
        }

        console.log("📥 Début du processus de récupération des données...");

        const congestionData = await db.collection("congestion_data").find().toArray();

        console.log("Données récupérées du simulateur :", congestionData.length, "enregistrements trouvés");

        res.status(200).json(congestionData);

    } catch (error) {
        console.error("❌ Erreur lors de la récupération des données :", error);
        throw error;
    }
}

module.exports = {get_congestionData};