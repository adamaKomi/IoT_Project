//récupérer une liste d'accidents depuis la base de données MongoDB
const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

const mongoURI = 'mongodb://localhost:27017';
const dbName = 'accidentsDB';
const collectionName = 'accidents';

router.get('/api/accidents', async (req, res) => {
  const client = new MongoClient(mongoURI);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const limit = parseInt(req.query.limit) || 1000;
    //Exécute une requête MongoDB pour récupérer les accidents
    const accidents = await collection
      .find({}) //Recherche tous les documents dans la collection accidents
      .sort({ crash_date: -1, crash_time: -1 })
      .limit(limit)
      .toArray(); //Convertit les résultats en un tableau

    res.json(accidents);
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données' });
  } finally {
    await client.close();
  }
});

module.exports = router;