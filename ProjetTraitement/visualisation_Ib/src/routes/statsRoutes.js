//calculer et renvoyer des statistiques globales sur les accidents
const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

const mongoURI = 'mongodb://localhost:27017';
const dbName = 'accidentsDB';
const collectionName = 'accidents';

router.get('/api/statistics', async (req, res) => {
  const client = new MongoClient(mongoURI);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    //Exécute une pipeline d'agrégation MongoDB pour calculer des statistiques globales sur les accidents
    const stats = await collection.aggregate([
      {
        //Regroupe tous les documents de la collection pour calculer des statistiques globales
        $group: {
          _id: null,
          totalAccidents: { $sum: 1 }, //nombre totale d'accidents
          totalInjured: { $sum: { $ifNull: ["$number_of_persons_injured", 0] } }, // nombre totale de blesses
          totalKilled: { $sum: { $ifNull: ["$number_of_persons_killed", 0] } } // nombre totale des tues
        }
      }
    ]).toArray();

    //Envoie les statistiques au client sous forme de réponse JSON
    res.json(stats[0] || { totalAccidents: 0, totalInjured: 0, totalKilled: 0 });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  } finally {
    await client.close();
  }
});

module.exports = router;