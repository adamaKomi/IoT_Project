// src/routes/zoneRoutes.js
const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const axios = require('axios');
router.get('/api/accidents/zones', async (req, res) => {
  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    const db = client.db('accidentsDB');
    const riskyRoutesCollection = db.collection('risky_routes');
    //Exécute une requête pour récupérer les routes à risque
    const zones = await riskyRoutesCollection
      .find({})
      .sort({ globalRiskIndex: -1 })
      .toArray();
    console.log('Routes à risque renvoyées:', zones);
    res.json(zones);
  } catch (error) {
    console.error('Erreur lors de la récupération des routes à risque:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des routes à risque' });
  } finally {
    await client.close();
  }
});

// Route pour proxyfier les requêtes OSRM
router.get('/api/osrm/route', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL manquante dans les paramètres de la requête' });
    }
    console.log('Requête OSRM via proxy:', url);
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Erreur lors de la requête OSRM via le proxy:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'itinéraire via OSRM' });
  }
});

module.exports = router;