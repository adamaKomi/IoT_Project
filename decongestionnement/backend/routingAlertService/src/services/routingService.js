/**
 * Service de routage
 * Ce service simule le calcul d'itinéraires alternatifs en évitant les zones congestionnées
 * Note: Cette version utilise des données simulées au lieu d'OSRM
 */

// Trouver des itinéraires alternatifs en évitant les zones congestionnées
async function findAlternativeRoutes(origin, destination, areasToAvoid) {
  try {
    // Simulation de calcul d'itinéraires alternatifs
    console.log(`Recherche d'itinéraires de [${origin}] à [${destination}] en évitant ${areasToAvoid.length} zones congestionnées`);
    
    // Simuler 3 itinéraires alternatifs
    const routes = [
      {
        id: "route_1",
        distance: 12500, // mètres
        duration: 1200,  // secondes
        congestionLevel: "green",
        avoidedCongestion: true,
        polyline: generateRandomPolyline(origin, destination),
        steps: generateRouteSteps(origin, destination, "principal")
      },
      {
        id: "route_2",
        distance: 13200,
        duration: 1350,
        congestionLevel: "green",
        avoidedCongestion: true,
        polyline: generateRandomPolyline(origin, destination),
        steps: generateRouteSteps(origin, destination, "secondaire")
      },
      {
        id: "route_3",
        distance: 14500,
        duration: 1500,
        congestionLevel: "yellow",
        avoidedCongestion: false,
        polyline: generateRandomPolyline(origin, destination),
        steps: generateRouteSteps(origin, destination, "tertiaire")
      }
    ];
    
    return routes;
  } catch (error) {
    console.error("Erreur lors de la recherche d'itinéraires alternatifs:", error);
    throw error;
  }
}

// Calculer l'itinéraire optimal en fonction des données de congestion
async function calculateOptimalRoute(origin, destination, congestionData, preferences = {}) {
  try {
    console.log(`Calcul du meilleur itinéraire de [${origin}] à [${destination}]`);
    
    // Identifier les voies à éviter complètement (congestion rouge)
    const lanestoAvoid = congestionData
      .filter(item => item.congestionLevel === "red")
      .map(item => item.lane_id);
    
    // Pénaliser les voies à congestion modérée (orange et jaune)
    const penalizedLanes = congestionData
      .filter(item => ["orange", "yellow"].includes(item.congestionLevel))
      .map(item => ({
        lane_id: item.lane_id,
        penalty: item.congestionLevel === "orange" ? 2.0 : 1.3 // Facteur multiplicateur pour le temps
      }));
    
    // Simuler le calcul du meilleur itinéraire
    
    // Calculer un itinéraire optimal simulé
    const optimalRoute = {
      id: "optimal_route",
      distance: 13800, // mètres
      duration: 1380,  // secondes
      congestionLevel: "green",
      polyline: generateRandomPolyline(origin, destination),
      steps: generateRouteSteps(origin, destination, "optimal"),
      avoidedCongestion: true,
      eta: new Date(Date.now() + 1380 * 1000).toISOString(),
      trafficConditions: {
        congestionPoints: 0,
        trafficFlow: "fluide"
      }
    };
    
    return optimalRoute;
  } catch (error) {
    console.error("Erreur lors du calcul de l'itinéraire optimal:", error);
    throw error;
  }
}

// Fonctions utilitaires pour la simulation

// Génère un polyline aléatoire entre deux points (simule un tracé de route)
function generateRandomPolyline(origin, destination) {
  // Dans une implémentation réelle, cette fonction serait remplacée par le polyline renvoyé par le service de routage
  const points = [origin];
  
  // Générer quelques points intermédiaires aléatoires
  const numPoints = 5;
  const [startLon, startLat] = origin;
  const [endLon, endLat] = destination;
  
  for (let i = 1; i <= numPoints; i++) {
    const ratio = i / (numPoints + 1);
    const lon = startLon + (endLon - startLon) * ratio + (Math.random() * 0.01 - 0.005);
    const lat = startLat + (endLat - startLat) * ratio + (Math.random() * 0.01 - 0.005);
    points.push([lon, lat]);
  }
  
  points.push(destination);
  return points;
}

// Génère des étapes pour un itinéraire (simule les instructions de navigation)
function generateRouteSteps(origin, destination, routeType) {
  // Simuler des instructions de navigation
  let steps = [];
  
  if (routeType === "principal") {
    steps = [
      { instruction: "Prendre la direction nord sur Avenue Principale", distance: 500 },
      { instruction: "Tourner à droite sur Boulevard Central", distance: 2200 },
      { instruction: "Continuer tout droit sur Voie Express", distance: 8000 },
      { instruction: "Prendre la sortie vers Rue de la Destination", distance: 1800 }
    ];
  } else if (routeType === "secondaire") {
    steps = [
      { instruction: "Prendre la direction nord-est sur Rue Secondaire", distance: 600 },
      { instruction: "Tourner à gauche sur Avenue Alternative", distance: 2500 },
      { instruction: "Au rond-point, prendre la 2ème sortie sur Route Parallèle", distance: 7500 },
      { instruction: "Tourner à droite sur Rue de la Destination", distance: 2600 }
    ];
  } else if (routeType === "tertiaire") {
    steps = [
      { instruction: "Prendre la direction est sur Chemin Rural", distance: 800 },
      { instruction: "Continuer sur Route Panoramique", distance: 4200 },
      { instruction: "Tourner à gauche sur Voie Périphérique", distance: 8000 },
      { instruction: "Tourner à droite sur Rue de la Destination", distance: 1500 }
    ];
  } else { // optimal
    steps = [
      { instruction: "Prendre la direction nord-ouest sur Avenue du Départ", distance: 700 },
      { instruction: "Tourner à droite sur Boulevard Rapide", distance: 3100 },
      { instruction: "Continuer tout droit sur Route Fluide", distance: 7200 },
      { instruction: "Tourner à gauche sur Rue de la Destination", distance: 2800 }
    ];
  }
  
  return steps;
}

module.exports = {
  findAlternativeRoutes,
  calculateOptimalRoute
};
