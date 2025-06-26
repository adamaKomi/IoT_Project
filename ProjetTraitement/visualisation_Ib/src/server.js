const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const cors = require('cors'); // ✅ Ajouté ici
const accidentRoutes = require('./routes/accidentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const { fetchAllAccidentData, saveToMongoDB, preprocessData } = require('./utils/import-data');

const app = express();
const port = 3003;

// ✅ Middleware CORS propre
app.use(cors({
  origin: 'http://localhost:5173', // autorise les requêtes depuis Vite
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
})); 

// Middleware pour parser le JSON
app.use(express.json()); 

// Monter les routes
app.use('/', accidentRoutes);
app.use('/', statsRoutes);
app.use('/', zoneRoutes);

// Définir l'URL de l'API des accidents
const apiURL = 'https://data.cityofnewyork.us/resource/h9gi-nx95.json';

// Fonction pour rafraîchir les données récentes
async function fetchRecentAccidentData() {
  let allData = [];
  let offset = 0;
  const limit = 10000;
  const batchSize = 50000;
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
    const newData = await fetchRecentAccidentData();
    const processedData = preprocessData(newData);

    client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    const db = client.db('accidentsDB');
    const collection = db.collection('accidents');

    const latestDateInDB = await collection.find().sort({ crash_date_obj: -1 }).limit(1).toArray();

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

// Exécuter la mise à jour toutes les 5 minutes
setInterval(refreshData, 300000);
// Initialiser la base de données et importer les données initiales
// Démarrer le serveur
app.listen(port, () => {
  console.log(`✅ Serveur démarré sur le port ${port}`);
});
