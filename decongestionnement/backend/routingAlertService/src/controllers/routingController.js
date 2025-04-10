const { getDB } = require("../config/db/database");
const { findAlternativeRoutes, calculateOptimalRoute } = require("../services/routingService");
const { classifyCongestionLevel } = require("../services/congestionAnalyzer");
const routingService = require("../services/routingService");

// Obtenir des itinéraires alternatifs en évitant les zones congestionnées
async function getAlternativeRoutes(req, res) {
  try {
    const { origin, destination } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: "L'origine et la destination sont requises" });
    }
    
    // Vérifier le format des coordonnées
    if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
      return res.status(400).json({ 
        error: "Format de coordonnées invalide. Format attendu: [longitude, latitude]" 
      });
    }
    
    const db = await getDB();
    
    // Récupérer les données de congestion actuelles
    const congestionData = await db.collection("congestion_data").find({}).toArray();
    
    // Identifier les zones à éviter (niveaux rouge et orange)
    const areasToAvoid = congestionData
      .map(data => {
        const level = classifyCongestionLevel(data);
        return {
          lane_id: data.lane_id,
          shape: data.shape,
          congestionLevel: level.level
        };
      })
      .filter(area => ["red", "orange"].includes(area.congestionLevel));
    
    // Calculer les itinéraires alternatifs
    const routes = await findAlternativeRoutes(origin, destination, areasToAvoid);
    
    res.status(200).json({
      origin,
      destination,
      alternativeRoutes: routes
    });
  } catch (error) {
    console.error("Erreur lors du calcul des itinéraires alternatifs:", error);
    res.status(500).json({ error: error.message });
  }
}

// Calculer le meilleur itinéraire en fonction des conditions actuelles
async function calculateBestRoute(req, res) {
  try {
    const { origin, destination, preferences } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: "L'origine et la destination sont requises" });
    }
    
    // Vérifier le format des coordonnées
    if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
      return res.status(400).json({ 
        error: "Format de coordonnées invalide. Format attendu: [longitude, latitude]" 
      });
    }
    
    const db = await getDB();
    
    // Récupérer les données de congestion actuelles
    const congestionData = await db.collection("congestion_data").find({}).toArray();
    
    // Classifier les données de congestion
    const classifiedData = congestionData.map(data => ({
      lane_id: data.lane_id,
      shape: data.shape,
      congestionLevel: classifyCongestionLevel(data).level
    }));
    
    // Calculer le meilleur itinéraire
    const optimalRoute = await calculateOptimalRoute(origin, destination, classifiedData, preferences);
    
    res.status(200).json({
      origin,
      destination,
      route: optimalRoute
    });
  } catch (error) {
    console.error("Erreur lors du calcul du meilleur itinéraire:", error);
    res.status(500).json({ error: error.message });
  }
}

// Calculer un itinéraire
async function calculateRoute(req, res) {
  try {
    const { start, end } = req.body;

    if (!start || !end) {
      return res.status(400).json({ 
        error: "Les coordonnées de départ et d'arrivée sont requises" 
      });
    }

    // Vérifier que les coordonnées sont valides
    if (!isValidCoordinateNew(start) || !isValidCoordinateNew(end)) {
      return res.status(400).json({ 
        error: "Format de coordonnées invalide, utilisez {lat, lng}" 
      });
    }

    // Récupérer les alertes de congestion pour les prendre en compte
    const db = await getDB();
    const congestionData = await db.collection("traffic_data").find({}).toArray();

    // Calculer l'itinéraire en tenant compte des données de congestion
    const route = await routingService.calculateRoute(start, end, congestionData);

    res.status(200).json({ route });
  } catch (error) {
    console.error("Erreur lors du calcul d'itinéraire:", error);
    res.status(500).json({ error: error.message });
  }
}

// Calculer des itinéraires alternatifs
async function calculateAlternativeRoutes(req, res) {
  try {
    const { start, end } = req.body;

    if (!start || !end) {
      return res.status(400).json({ 
        error: "Les coordonnées de départ et d'arrivée sont requises" 
      });
    }

    // Vérifier que les coordonnées sont valides
    if (!isValidCoordinateNew(start) || !isValidCoordinateNew(end)) {
      return res.status(400).json({ 
        error: "Format de coordonnées invalide, utilisez {lat, lng}" 
      });
    }

    console.log(`Calcul d'itinéraires alternatifs de [${start.lat}, ${start.lng}] à [${end.lat}, ${end.lng}]`);

    // Récupérer les alertes de congestion pour les prendre en compte
    const db = await getDB();
    const congestionData = await db.collection("traffic_data").find({}).toArray();

    // Calculer l'itinéraire original
    const originalRoute = await routingService.calculateRoute(start, end, congestionData);
    
    // Calculer un itinéraire alternatif évitant les zones de congestion
    const alternativeRoute = await routingService.calculateAlternativeRoute(start, end, congestionData);
    
    // Comparer les deux itinéraires pour déterminer lequel est le meilleur
    const isBetterThanOriginal = alternativeRoute.duration < originalRoute.duration;
    
    res.status(200).json({ 
      route: alternativeRoute,
      originalDuration: originalRoute.duration,
      isBetterThanOriginal
    });
  } catch (error) {
    console.error("Erreur lors du calcul d'itinéraires alternatifs:", error);
    res.status(500).json({ error: error.message });
  }
}

// Valider le format des coordonnées [longitude, latitude]
function isValidCoordinate(coord) {
  return Array.isArray(coord) && 
         coord.length === 2 && 
         typeof coord[0] === 'number' && 
         typeof coord[1] === 'number' &&
         coord[0] >= -180 && coord[0] <= 180 &&
         coord[1] >= -90 && coord[1] <= 90;
}

// Vérifier si une coordonnée est valide
function isValidCoordinateNew(coord) {
  return coord && 
         typeof coord === 'object' && 
         'lat' in coord && 
         'lng' in coord &&
         !isNaN(coord.lat) && 
         !isNaN(coord.lng) &&
         coord.lat >= -90 && 
         coord.lat <= 90 && 
         coord.lng >= -180 && 
         coord.lng <= 180;
}

module.exports = {
  getAlternativeRoutes,
  calculateBestRoute,
  calculateRoute,
  calculateAlternativeRoutes
};
