const {get_congestionDB} = require("./congestionDB")
// Fonction pour sauvegarder dans MongoDB
const saveCongestionData = async (data) => {
    try {
        const db = get_congestionDB();
        const collection = db.collection('congestion_data');

        // Pour chaque élément, faire un upsert
        const operations = data.map(item => ({
            updateOne: {
                filter: { lane_id: item.lane_id }, // Critère de recherche
                update: { $set: item },           // Mise à jour des données
                upsert: true                      // Insérer si non trouvé
            }
        }));

        const result = await collection.bulkWrite(operations);
        console.log(`✅ Données enregistrées : ${result.upsertedCount} insérées, ${result.modifiedCount} mises à jour`);
    } catch (error) {
        console.error('❌ Erreur lors de l’enregistrement dans la base de données \'congestion_db\' :', error);
    }
};

module.exports = {saveCongestionData};