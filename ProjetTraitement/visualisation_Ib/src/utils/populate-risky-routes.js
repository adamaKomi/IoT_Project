// src/populate-risky-routes.js
const { MongoClient } = require('mongodb');
const mongoURI = 'mongodb://localhost:27017';
const dbName = 'accidentsDB';
const normalizeRiskIndex = (riskIndex, minRisk, maxRisk) => {
  return ((riskIndex - minRisk) / (maxRisk - minRisk)) * 100;
};


async function populateRiskyRoutes() {
  const client = new MongoClient(mongoURI);
  try {
    await client.connect();
    const db = client.db(dbName);
    const accidentsCollection = db.collection('accidents');
    const riskyRoutesCollection = db.collection('risky_routes');

    // Vider la collection risky_routes si elle existe
    await riskyRoutesCollection.deleteMany({});

    // Calculer les statistiques par route et conserver les accidents
    const routeStats = await accidentsCollection
      .aggregate([
        {
        //filtrer les documents pour ne conserver que ceux qui répondent aux critères
          $match: {
            on_street_name: { $exists: true, $ne: null, $ne: '' }, // S'assurer que on_street_name existe et n'est pas vide
            latitude: { $exists: true, $ne: null, $type: ['double', 'decimal', 'int', 'long'] },
            longitude: { $exists: true, $ne: null, $type: ['double', 'decimal', 'int', 'long'] }
          }
        },
        {
        //regroupe les accidents par nom de rue (on_street_name) et calcule des statistiques pour chaque groupe
          $group: {
            _id: '$on_street_name', // Regrouper par nom de la route
            accidentCount: { $sum: 1 },
            totalInjured: { $sum: { $ifNull: ['$number_of_persons_injured', 0] } },
            totalKilled: { $sum: { $ifNull: ['$number_of_persons_killed', 0] } },
            coordinates: { $push: { lat: '$latitude', lng: '$longitude' } }, // Crée un tableau des coordonnées
            accidents: { // Ajouter une liste des accidents
              $push: {
                crash_date: '$crash_date',
                crash_time: '$crash_time',
                number_of_persons_injured: '$number_of_persons_injured',
                number_of_persons_killed: '$number_of_persons_killed',
                contributing_factor_vehicle_1: '$contributing_factor_vehicle_1',
                latitude: '$latitude',
                longitude: '$longitude'
              }
            }
          }
        },
        {
        //reformuler les documents pour inclure les champs souhaités
          $project: {
            route_name: '$_id',
            accidentCount: 1,
            totalInjured: 1,
            totalKilled: 1,
            globalRiskIndex: {
              $sum: [
                { $multiply: ['$accidentCount', 1] },
                { $multiply: ['$totalInjured', 2] },
                { $multiply: ['$totalKilled', 5] }
              ]
            },
            coordinates: 1,
            accidents: 1, 
            _id: 0
          }
        },
        { $sort: { globalRiskIndex: -1 } } // Trier par indice de risque décroissant
      ])
      .toArray();

      // Trouver le min et le max de globalRiskIndex
    const riskIndices = routeStats.map(route => route.globalRiskIndex);
    const minRisk = Math.min(...riskIndices);
    const maxRisk = Math.max(...riskIndices);

    const normalizedRouteStats = routeStats.map(route => ({
      ...route,
      normalizedRiskIndex: normalizeRiskIndex(route.globalRiskIndex, minRisk, maxRisk)
    }));

    // Insérer les résultats dans la collection risky_routes
    if (normalizedRouteStats.length > 0) {
      await riskyRoutesCollection.insertMany(normalizedRouteStats);
      console.log(`${normalizedRouteStats.length} routes insérées dans risky_routes.`);
    } else {
      console.log('Aucune route à insérer.');
    }
  } catch (error) {
    console.error('Erreur lors du calcul des routes à risque:', error);
  } finally {
    await client.close();
    console.log('Connexion MongoDB fermée');
  }
}

if (require.main === module) {
  populateRiskyRoutes();
}