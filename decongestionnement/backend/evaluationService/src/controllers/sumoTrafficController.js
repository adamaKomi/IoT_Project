const {get_sumoTrafficDB} = require("../config/db/sumoTraficDB");
const {connect_congestionDB} = require("../config/db/congestionDB");
const {congestionEvaluation} = require("../evaluation/congestionEvaluation");
const {saveCongestionData} = require("../config/db/saveCongestionData");

const get__simulationData = async () => {
    try {
        const db = await get_sumoTrafficDB();

        if (!db) {
            throw new Error("❌ Base de données non connectée !");
        }

        const simulation_data = await db.collection("traffic_data").find().toArray();

        console.log("Données récupérées du simulateur :", simulation_data.length, "enregistrements trouvés");
        return simulation_data;
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des données :", error);
        throw error;
    }
};

const save_congestionData_to_DB = async (data) => {
    try {
        console.log("🔄 Connexion à la base de données de congestion...");
        await connect_congestionDB();

        console.log("📊 Calcul des données de congestion...");
        const congestionData = congestionEvaluation(data);

        console.log("💾 Sauvegarde des données de congestion en cours...");
        await saveCongestionData(congestionData);

        console.log("✅ Données de congestion enregistrées avec succès !");
    } catch (error) {
        console.error("❌ Erreur lors de la sauvegarde des données de congestion :", error);
        throw error;
    }
};

const congestionDataToDB = async (req, res) => {
    try {
        console.log("📥 Début du processus de récupération et sauvegarde des données...");

        const simulation_data = await get__simulationData();
        await save_congestionData_to_DB(simulation_data);

        res.json({ message: "✅ Données de congestion enregistrées avec succès" });
    } catch (error) {
        console.error("❌ Erreur :", error);
        res.status(500).json({ error: "Erreur lors de la récupération et de l'enregistrement des données" });
    }
};

module.exports = { congestionDataToDB };
