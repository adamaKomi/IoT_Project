/**
 * Service d'analyse de congestion
 * Ce service permet d'analyser les données de trafic et de déterminer le niveau de congestion
 */

// Analyser les données de congestion pour déterminer les niveaux
function analyzeCongestionData(congestionData) {
  return congestionData.map(data => {
    const level = classifyCongestionLevel(data);
    return {
      lane_id: data.lane_id,
      congestionLevel: level.level,
      color: level.color,
      details: {
        halting_number: data.halting_number,
        lane_length: data.lane_length,
        max_speed: data.max_speed,
        vehicles_count: data.vehicles ? data.vehicles.length : 0,
        average_speed: calculateAverageSpeed(data.vehicles)
      }
    };
  });
}

// Classifier le niveau de congestion en fonction des données
function classifyCongestionLevel(data) {
  console.log(`Analyse de congestion pour voie: ${data.lane_id}`);
  // Vérifier si les données sont valides et contiennent des véhicules
  if (!data || !data.vehicles) {
    console.log(`Données invalides ou pas de véhicules pour voie: ${data.lane_id}`);
    return { level: "green", color: "#4CAF50" };
  }

  // Extraire les informations pertinentes pour l'analyse
  const vehicleCount = data.vehicles.length;
  const laneLength = data.lane_length || 100; // Valeur par défaut si non disponible
  const haltingCount = data.halting_number || 0;
  const maxSpeed = data.max_speed || 50; // Valeur par défaut si non disponible

  console.log(`Analyse de voie ${data.lane_id}: ${vehicleCount} véhicules, ${haltingCount} arrêtés, longueur ${laneLength}m, vitesse max ${maxSpeed}km/h`);

  // Si pas de véhicules, pas de congestion
  if (vehicleCount === 0) {
    return { level: "green", color: "#4CAF50" };
  }

  // Calculer la densité des véhicules (nombre de véhicules par unité de longueur)
  const vehicleDensity = vehicleCount / laneLength;
  
  // Calculer la vitesse moyenne des véhicules
  const avgSpeed = calculateAverageSpeed(data.vehicles);
  
  // Rapport de la vitesse moyenne à la vitesse maximale
  const speedRatio = maxSpeed > 0 ? avgSpeed / maxSpeed : 1;
  
  // Nombre de véhicules à l'arrêt
  const haltingRatio = vehicleCount > 0 ? haltingCount / vehicleCount : 0;

  console.log(`Métriques de congestion: densité=${vehicleDensity.toFixed(4)}, vitesse moyenne=${avgSpeed.toFixed(2)}km/h, ratio vitesse=${speedRatio.toFixed(2)}, ratio arrêt=${haltingRatio.toFixed(2)}`);

  // Évaluer le niveau de congestion en combinant plusieurs facteurs
  // Logique de classification:
  // - Rouge: Trafic très dense et lent (forte congestion)
  // - Orange: Trafic dense avec ralentissement (congestion modérée)
  // - Jaune: Trafic légèrement ralenti (congestion légère)
  // - Vert: Trafic fluide (pas de congestion)
  
  if (haltingRatio > 0.5 || (speedRatio < 0.3 && vehicleDensity > 0.2)) {
    console.log(`Congestion ROUGE détectée sur voie ${data.lane_id}`);
    return { level: "red", color: "#F44336" };
  } else if (haltingRatio > 0.3 || (speedRatio < 0.5 && vehicleDensity > 0.15)) {
    console.log(`Congestion ORANGE détectée sur voie ${data.lane_id}`);
    return { level: "orange", color: "#FF9800" };
  } else if (haltingRatio > 0.1 || (speedRatio < 0.7 && vehicleDensity > 0.1)) {
    console.log(`Congestion JAUNE détectée sur voie ${data.lane_id}`);
    return { level: "yellow", color: "#FFEB3B" };
  } else {
    return { level: "green", color: "#4CAF50" };
  }
}

// Calculer la vitesse moyenne des véhicules
function calculateAverageSpeed(vehicles) {
  if (!vehicles || vehicles.length === 0) {
    return 0;
  }
  
  const totalSpeed = vehicles.reduce((sum, vehicle) => sum + (vehicle.speed || 0), 0);
  return totalSpeed / vehicles.length;
}

// Vérifier si une route a des accidents actifs
function hasActiveAccidents(data) {
  return data.accidents !== null && data.accidents !== undefined;
}

module.exports = {
  analyzeCongestionData,
  classifyCongestionLevel,
  hasActiveAccidents
};
