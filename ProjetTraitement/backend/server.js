// Charger les variables d'environnement depuis un fichier .env
require('dotenv').config();

// Importer les modules nécessaires
const express = require('express'); // Framework pour créer des applications web et API
const mongoose = require('mongoose'); // Bibliothèque pour interagir avec MongoDB
const accidentRoutes = require('./routes/accidents'); // Routes pour gérer les données d'accidents
const cron = require('node-cron'); // Module pour planifier des tâches récurrentes
const axios = require('axios'); // Module pour effectuer des requêtes HTTP
const cors = require('cors'); // Middleware pour gérer les politiques de partage des ressources (CORS)

// Initialiser une application Express
const app = express();

// Activer CORS pour permettre les requêtes provenant d'autres domaines
app.use(cors());

// Activer le traitement des requêtes JSON
app.use(express.json());

// Ajouter les routes pour les accidents
app.use('/accidents', accidentRoutes);

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
   
})
  .then(() => console.log("Connecté à MongoDB")) // Message en cas de succès
  .catch(err => console.error("Erreur de connexion à MongoDB", err)); // Message en cas d'erreur

// Planifier une tâche cron pour mettre à jour les données toutes les 1 minute
cron.schedule('*/5 * * * *', async () => {
  console.log("Mise à jour automatique des accidents...");
  try {
    // Envoyer une requête POST pour mettre à jour les données d'accidents
    const response = await axios.post('http://localhost:3000/accidents/update');
    // Envoyer une requête POST pour mettre à jour les statistiques des accidents par période
    const response1 = await axios.post('http://localhost:3000/accidents/crash-per-period/update');
    console.log("Mise à jour terminée des accidents:", response.data.message); // Message de succès
    console.log("Mise à jour terminée des statistiques:", response1.data.message); // Message de succès
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error.message); // Message en cas d'erreur
  }
});

// Lancer le serveur sur le port spécifié dans les variables d'environnement ou sur le port 3000 par défaut
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`); // Message indiquant que le serveur est en cours d'exécution
});