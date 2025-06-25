const { getDB } = require("../config/db/database");

// Récupérer toutes les alertes de congestion actives
async function getCongestionAlerts(req, res) {
  try {
    const db = await getDB();
    
    // Récupérer les données de congestion de la base de données depuis la collection congestion_data
    const congestionData = await db.collection("congestion_data").find({}).toArray();
    
    console.log(`Données de trafic récupérées: ${congestionData.length} enregistrements`);
    
    if (congestionData.length === 0) {
      console.log("Aucune donnée de trafic trouvée. Vérifiez que la simulation SUMO est en cours d'exécution.");
      return res.status(200).json([]);
    }
    
    res.status(200).json(congestionData);
  } catch (error) {
    console.error("Erreur lors de la récupération des alertes de congestion:", error);
    res.status(500).json({ error: error.message });
  }
}


module.exports = {
  getCongestionAlerts,
};
// 