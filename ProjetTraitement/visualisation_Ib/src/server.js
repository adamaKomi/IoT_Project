const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios'); // Ajout de l'importation d'axios
const accidentRoutes = require('./routes/accidentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const { fetchAllAccidentData, saveToMongoDB, preprocessData } = require('./utils/import-data');

const app = express();
const port = 3003;

// Définir l'URL de l'API des accidents
const apiURL = 'https://data.cityofnewyork.us/resource/h9gi-nx95.json';

// Middleware pour gérer CORS manuellement
app.use((req, res, next) => {
  // Autoriser les requêtes provenant de localhost:3000 (votre frontend)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3003');
  
  // Autoriser les méthodes HTTP spécifiques
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Autoriser certains en-têtes dans les requêtes
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Autoriser les cookies (si nécessaire)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // Répondre immédiatement avec un statut 200 pour les requêtes OPTIONS
  }
  
  next(); // Passer au middleware suivant
});

// Middleware pour parser le JSON
app.use(express.json());

// Monter les routes
app.use('/', accidentRoutes);
app.use('/', statsRoutes);
app.use('/', zoneRoutes);

// Fonction pour rafraîchir les données
async function fetchRecentAccidentData() {
  let allData = [];
  let offset = 0;
  const limit = 10000;
  const batchSize = 50000;
  // Calculer la date d'il y a 7 jours
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  while (offset < batchSize) {
    try {
      console.log(`Récupération du lot ${offset} à ${offset + limit}...`);
      const response = await axios.get(apiURL, {
        params: {
          $limit: limit,
          $offset: offset,
          $where: `crash_date >= '${sevenDaysAgo}'`,
          $order: 'crash_date DESC, crash_time DESC'
        }
      });

      if (response.data.length === 0) {
        console.log('Plus de données disponibles.');
        break;
      }

      allData = [...allData, ...response.data];
      console.log(`${response.data.length} accidents récupérés.`);

      offset += limit;

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error.message);
      break;
    }
  }

  console.log(`Total de ${allData.length} accidents récupérés.`);
  return allData;
}

async function refreshData() {
  let client;
  try {
    console.log('Rafraîchissement des données...');
    const newData = await fetchRecentAccidentData(); // Utiliser fetchRecentAccidentData
    const processedData = preprocessData(newData);
    
    client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('accidentsDB');
    const collection = db.collection('accidents');

    const latestDateInDB = await collection
      .find()
      .sort({ crash_date_obj: -1 })
      .limit(1)
      .toArray();

    const newRecords = processedData.filter(newItem => {
      if (!latestDateInDB[0] || !latestDateInDB[0].crash_date_obj) return true;
      return newItem.crash_date_obj > latestDateInDB[0].crash_date_obj;
    });

    if (newRecords.length > 0) {
      await collection.insertMany(newRecords, { ordered: false });
      console.log(`${newRecords.length} nouvelles données insérées.`);
    } else {
      console.log('Aucune nouvelle donnée à insérer.');
    }
  } catch (error) {
    console.error('Erreur lors du rafraîchissement des données:', error);
  } finally {
    if (client) await client.close();
  }
}

// Planifier le rafraîchissement toutes les 5 minutes (300000 ms)
setInterval(refreshData, 300000);



// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});