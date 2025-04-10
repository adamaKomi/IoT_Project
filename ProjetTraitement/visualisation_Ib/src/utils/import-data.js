// src/import-data.js
const axios = require('axios');
const { MongoClient } = require('mongodb');
const { cleanAccidentData } = require('./dataCleaner');

const mongoURI = 'mongodb://localhost:27017';
const dbName = 'accidentsDB';
const collectionName = 'accidents';

const apiURL = 'https://data.cityofnewyork.us/resource/h9gi-nx95.json';
const batchSize =100000;
const chunkSize = 10000;

async function fetchAllAccidentData() {
  console.log('Démarrage de la récupération des données...');
  
  let allData = [];
  let offset = 0;
  
  while (offset < batchSize) {
    try {
      console.log(`Récupération du lot ${offset} à ${offset + chunkSize}...`);
      
      const response = await axios.get(apiURL, {
        params: {
          $limit: chunkSize,
          $offset: offset,
          $where: "crash_date >= '2022-01-01T00:00:00.000'", // Filtre depuis 2022
          $order: 'crash_date DESC, crash_time DESC'
        }
      });
      
      if (response.data.length === 0) {
        console.log('Plus de données disponibles.');
        break;
      }
      
      allData = [...allData, ...response.data];
      console.log(`${response.data.length} accidents récupérés.`);
      
      offset += chunkSize;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error.message);
      if (error.response) {
        console.error('Détails de la réponse:', error.response.data);
      }
      break;
    }
  }
  
  console.log(`Total de ${allData.length} accidents récupérés.`);
  return allData;
}

async function saveToMongoDB(data) {
  const client = new MongoClient(mongoURI);
  
  try {
    await client.connect();
    console.log('Connecté à MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    await collection.createIndex({ crash_date: -1, crash_time: -1 });
    await collection.createIndex({ latitude: 1, longitude: 1 });
    await collection.createIndex({ collision_id: 1 }, { unique: true }); // Ajouter un index unique pour éviter les doublons
    
    const count = await collection.countDocuments();
    if (count > 0) {
      console.log(`La collection contient déjà ${count} documents. Nettoyage...`);
      await collection.deleteMany({});
    }
    
    console.log('Insertion des données dans MongoDB...');
    const result = await collection.insertMany(data, { ordered: false });
    
    console.log(`${result.insertedCount} accidents insérés avec succès.`);
    
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement dans MongoDB:', error.message);
    if (error.code === 11000) {
      console.warn('Certains accidents ont été ignorés en raison de doublons (collision_id).');
    }
  } finally {
    await client.close();
    console.log('Connexion MongoDB fermée');
  }
}

function preprocessData(data) {
  // Étape 1 : Nettoyer les données avec cleanAccidentData
  let cleanedData = data.map(accident => {
    const cleanedAccident = cleanAccidentData(accident); // Appliquer la fonction de nettoyage
    if (!cleanedAccident) return null; // Si cleanAccidentData retourne null, ignorer cet accident
    return cleanedAccident;
  });

  // Étape 2 : Filtrer les accidents valides (non null)
  cleanedData = cleanedData.filter(accident => accident !== null);

  // Étape 3 : Traiter les données nettoyées (conversions supplémentaires si nécessaire)
  cleanedData = cleanedData.map(accident => {
    let processedAccident = { ...accident };

    // Valider et convertir latitude et longitude
    if (
      processedAccident.latitude &&
      processedAccident.longitude &&
      !isNaN(parseFloat(processedAccident.latitude)) &&
      !isNaN(parseFloat(processedAccident.longitude))
    ) {
      processedAccident.latitude = parseFloat(processedAccident.latitude);
      processedAccident.longitude = parseFloat(processedAccident.longitude);
    } else {
      processedAccident.latitude = null;
      processedAccident.longitude = null;
    }

    // Valider et convertir number_of_persons_injured
    if (
      processedAccident.number_of_persons_injured &&
      !isNaN(parseInt(processedAccident.number_of_persons_injured))
    ) {
      processedAccident.number_of_persons_injured = parseInt(processedAccident.number_of_persons_injured);
    } else {
      processedAccident.number_of_persons_injured = 0;
    }

    // Valider et convertir number_of_persons_killed
    if (
      processedAccident.number_of_persons_killed &&
      !isNaN(parseInt(processedAccident.number_of_persons_killed))
    ) {
      processedAccident.number_of_persons_killed = parseInt(processedAccident.number_of_persons_killed);
    } else {
      processedAccident.number_of_persons_killed = 0;
    }

    return processedAccident;
  })
  .filter(accident => {
    // Filtrer les accidents avec des coordonnées valides
    const isValid = 
      accident.latitude !== null && 
      accident.longitude !== null && 
      !isNaN(accident.latitude) && 
      !isNaN(accident.longitude);
    if (!isValid) {
      console.warn('Accident filtered out due to invalid coordinates:', accident);
    }
    return isValid;
  });

  // Étape 4 : Supprimer les doublons basés sur collision_id
  const seenCollisionIds = new Set();
  const uniqueData = cleanedData.filter(accident => {
    if (accident.collision_id) {
      if (seenCollisionIds.has(accident.collision_id)) {
        console.warn('Duplicate collision_id filtered out:', accident.collision_id);
        return false;
      }
      seenCollisionIds.add(accident.collision_id);
      return true;
    }
    return false; // Ignorer les accidents sans collision_id
  });

  console.log(`Après nettoyage et déduplication: ${uniqueData.length} accidents valides.`);
  return uniqueData;
}

async function main() {
  try {
    const rawData = await fetchAllAccidentData();
    const processedData = preprocessData(rawData);
    await saveToMongoDB(processedData);
    console.log('Processus d\'importation terminé avec succès.');
  } catch (error) {
    console.error('Erreur dans le processus principal:', error);
  }
}

module.exports = {
  fetchAllAccidentData,
  saveToMongoDB,
  preprocessData
};

if (require.main === module) {
  main();
}