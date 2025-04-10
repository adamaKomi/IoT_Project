/**
 * Service d'alertes
 * Responsable de la gestion et de l'envoi des alertes de congestion
 */

const { getDB } = require("../config/db/database");
const { analyzeCongestionData, classifyCongestionLevel } = require("./congestionAnalyzer");

// Périodiquement rechercher les congestions et envoyer des alertes
async function monitorCongestion(io) {
  const db = await getDB();
  const congestionData = await db.collection("traffic_data").find({}).toArray();
  const alerts = analyzeCongestionData(congestionData).filter(data => data.congestionLevel !== "green");
  if (alerts.length > 0) {
    await saveAlerts(alerts);
    io.emit("congestion_alert", alerts);
  }
  return alerts;
}

// Enregistrer les alertes dans la base de données
async function saveAlerts(alerts) {
  try {
    const db = await getDB();
    
    // Ajouter un timestamp aux alertes
    const timestampedAlerts = alerts.map(alert => ({
      ...alert,
      timestamp: new Date(),
      active: true
    }));
    
    // Enregistrer les alertes dans la collection
    const result = await db.collection("congestion_alerts").insertMany(timestampedAlerts);
    console.log(`${result.insertedCount} alertes enregistrées dans la base de données`);
    
    return result;
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des alertes:", error);
    throw error;
  }
}

// Envoyer les alertes aux utilisateurs concernés par WebSockets
function sendAlertsToUsers(io, alerts) {
  try {
    console.log("Envoi des alertes aux utilisateurs connectés...");
    
    // Pour chaque alerte, envoyer aux utilisateurs dans la zone correspondante
    alerts.forEach(alert => {
      // Format de l'alerte pour les utilisateurs
      const userAlert = {
        id: alert.lane_id,
        level: alert.congestionLevel,
        color: alert.color,
        message: generateAlertMessage(alert.congestionLevel, alert.lane_id),
        location: alert.details ? alert.details.location : null,
        timestamp: new Date()
      };
      
      // Envoyer l'alerte aux utilisateurs abonnés à cette zone
      io.to(`area_all`).emit('congestion_alert', userAlert);
      
      // Si nous avons des informations géographiques, cibler les utilisateurs par zone
      if (userAlert.location) {
        // Déterminer dans quelle zone géographique se trouve l'alerte
        // Cela dépendrait de comment vous avez structuré vos zones géographiques
        const geographicArea = determineGeographicArea(userAlert.location);
        if (geographicArea) {
          io.to(`area_${geographicArea}`).emit('congestion_alert', userAlert);
        }
      }
      
      // Envoyer des alertes plus graves à tous les utilisateurs
      if (alert.congestionLevel === "red") {
        io.emit('critical_congestion_alert', userAlert);
      }
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi des alertes aux utilisateurs:", error);
  }
}

// Déterminer dans quelle zone géographique se trouve une localisation
function determineGeographicArea(location) {
  // Cette fonction serait implémentée pour déterminer la zone géographique
  // basée sur les coordonnées de la localisation
  // Exemple simple: diviser la carte en quadrants
  
  if (!location || !Array.isArray(location) || location.length < 2) {
    return null;
  }
  
  const [lon, lat] = location;
  
  // Exemple très simpliste de division par quadrants
  // Dans une implémentation réelle, vous utiliseriez un système plus sophistiqué
  if (lon >= 0 && lat >= 0) return "northeast";
  if (lon < 0 && lat >= 0) return "northwest";
  if (lon < 0 && lat < 0) return "southwest";
  if (lon >= 0 && lat < 0) return "southeast";
  
  return null;
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

// Récupérer les abonnements d'un utilisateur
async function getUserSubscriptions(userId) {
  try {
    const db = await getDB();
    const subscription = await db.collection("user_subscriptions").findOne({ userId });
    return subscription ? subscription.subscribedAreas : [];
  } catch (error) {
    console.error("Erreur lors de la récupération des abonnements:", error);
    return [];
  }
}

module.exports = {
  monitorCongestion,
  sendAlertsToUsers,
  getUserSubscriptions
};
