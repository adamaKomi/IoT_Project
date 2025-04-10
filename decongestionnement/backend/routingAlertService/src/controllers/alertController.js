const { getDB } = require("../config/db/database");
const { analyzeCongestionData, classifyCongestionLevel } = require("../services/congestionAnalyzer");

// Récupérer toutes les alertes de congestion actives
async function getCongestionAlerts(req, res) {
  try {
    const db = await getDB();
    
    // Récupérer les données de congestion de la base de données depuis la collection traffic_data
    // au lieu de congestion_data pour correspondre à ce que le simulateur utilise
    const congestionData = await db.collection("congestion_data").find({}).toArray();
    
    console.log(`Données de trafic récupérées: ${congestionData.length} enregistrements`);
    
    // if (congestionData.length === 0) {
    //   console.log("Aucune donnée de trafic trouvée. Vérifiez que la simulation SUMO est en cours d'exécution.");
    //   return res.status(200).json([]);
    // }
    
    // // Analyser et classifier les données de congestion
    // const alerts = congestionData.map(data => {
    //   const level = classifyCongestionLevel(data);
    //   return {
    //     lane_id: data.lane_id,
    //     location: data.shape ? data.shape[0] : null, // Première position géographique de la voie
    //     congestionLevel: level.level,
    //     color: level.color,
    //     message: generateAlertMessage(level.level, data.lane_id),
    //     timestamp: new Date(),
    //     raw_data: {
    //       halting_number: data.halting_number,
    //       max_speed: data.max_speed,
    //       vehicleCount: data.vehicles ? data.vehicles.length : 0
    //     }
    //   };
    // }).filter(alert => alert.congestionLevel !== "green"); // Ne pas inclure les alertes de niveau vert (pas de congestion)
    
    console.log(`Alertes de congestion détectées: ${congestionData.length}`);
    
    res.status(200).json(congestionData);
  } catch (error) {
    console.error("Erreur lors de la récupération des alertes de congestion:", error);
    res.status(500).json({ error: error.message });
  }
}

// S'abonner aux alertes d'une zone géographique
async function subscribeToArea(req, res) {
  try {
    const { userId, area } = req.body;
    
    if (!userId || !area) {
      return res.status(400).json({ error: "userId et area sont requis" });
    }
    
    const db = await getDB();
    
    // Enregistrer l'abonnement dans la base de données
    await db.collection("user_subscriptions").updateOne(
      { userId },
      { $addToSet: { subscribedAreas: area } },
      { upsert: true }
    );
    
    // Si WebSockets est configuré
    if (req.app.get("socketio")) {
      // Ajouter l'utilisateur à une salle pour cette zone
      const io = req.app.get("socketio");
      const sockets = await io.fetchSockets();
      
      // Trouver le socket de l'utilisateur et le joindre à la salle correspondant à la zone
      for (const socket of sockets) {
        if (socket.handshake.query.userId === userId) {
          socket.join(`area_${area}`);
        }
      }
    }
    
    res.status(200).json({ message: "Abonnement aux alertes réussi", area });
  } catch (error) {
    console.error("Erreur lors de l'abonnement aux alertes:", error);
    res.status(500).json({ error: error.message });
  }
}

// Se désabonner des alertes
async function unsubscribeFromArea(req, res) {
  try {
    const { userId, area } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "userId est requis" });
    }
    
    const db = await getDB();
    
    if (area) {
      // Supprimer une zone spécifique
      await db.collection("user_subscriptions").updateOne(
        { userId },
        { $pull: { subscribedAreas: area } }
      );
    } else {
      // Supprimer tous les abonnements
      await db.collection("user_subscriptions").deleteOne({ userId });
    }
    
    // Si WebSockets est configuré
    if (req.app.get("socketio")) {
      const io = req.app.get("socketio");
      const sockets = await io.fetchSockets();
      
      for (const socket of sockets) {
        if (socket.handshake.query.userId === userId) {
          if (area) {
            socket.leave(`area_${area}`);
          } else {
            // Quitter toutes les salles sauf la salle par défaut
            socket.rooms.forEach(room => {
              if (room !== socket.id) {
                socket.leave(room);
              }
            });
          }
        }
      }
    }
    
    res.status(200).json({ 
      message: area ? "Désabonnement de la zone réussi" : "Désabonnement de toutes les zones réussi" 
    });
  } catch (error) {
    console.error("Erreur lors du désabonnement des alertes:", error);
    res.status(500).json({ error: error.message });
  }
}

// Générer un message d'alerte en fonction du niveau de congestion
function generateAlertMessage(level, laneId) {
  switch (level) {
    case "red":
      return `ALERTE TRAFIC IMPORTANT: La route ${laneId} est fortement congestionnée. Évitez cette zone si possible.`;
    case "orange":
      return `ATTENTION: Trafic dense sur la route ${laneId}. Envisagez un itinéraire alternatif.`;
    case "yellow":
      return `INFORMATION: Circulation ralentie sur la route ${laneId}.`;
    default:
      return `Trafic normal sur la route ${laneId}.`;
  }
}

module.exports = {
  getCongestionAlerts,
  subscribeToArea,
  unsubscribeFromArea
};
