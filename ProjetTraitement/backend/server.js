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
  // options éventuelles
})
 /**
  * Connexion à MongoDB et initialisation des données
  * Cette section gère l'importation initiale des données d'accidents,
  * le nettoyage des données, et la génération des statistiques.
  */
  .then(async () => {
    console.log("Connecté à MongoDB");

    const fetchNYCAccidentData = require('./services/fetchNYCData');
    const cleanAccidentData = require('./services/cleanData');
    const Accident = require('./models/Accident');
    const crash_current = require('./services/CrashperPeriod');
    const statModel = require('./models/Stats');


   
    // Vérifier le nombre de documents dans chaque collection
    const accidentsCount = await Accident.countDocuments().catch(() => 0);
    let statsCount = 0;
    try {
      statsCount = await statModel.countDocuments();
    } catch {
      statsCount = 0;
    }

    if (accidentsCount === 0) {
      // Importer, nettoyer et insérer les accidents
      try {
        const rawData = await fetchNYCAccidentData();
        const cleanedData = await cleanAccidentData(rawData);
        const existingIds = new Set(await Accident.distinct("collision_id"));
        const uniqueAccidents = Array.from(
          new Map(
            cleanedData
              .filter(accident => accident.collision_id && !existingIds.has(accident.collision_id))
              .map(acc => [acc.collision_id, acc])
          ).values()
        );

        if (uniqueAccidents.length > 0) {
          await Accident.insertMany(uniqueAccidents);
          console.log(`Import initial : ${uniqueAccidents.length} nouveaux accidents ajoutés.`);
        } else {
          console.log("Import initial : Aucun nouvel accident à ajouter.");
        }
      } catch (err) {
        console.error("Erreur lors de l'import initial des accidents :", err.message);
      }

      // Supprimer complètement la collection stats si elle existe
      try {
        await statModel.collection.drop();
        console.log("Collection 'stats' supprimée.");
      } catch (err) {
        if (err.code === 26) {
          console.log("Collection 'stats' inexistante, rien à supprimer.");
        } else {
          console.error("Erreur lors de la suppression de 'stats' :", err.message);
        }
      }

      // Générer et insérer les nouvelles statistiques
      try {
        const accidents = await Accident.find();
        const crashPerPeriod = crash_current(accidents);
        if (crashPerPeriod.length > 0) {
          await statModel.insertMany(crashPerPeriod);
          console.log("Statistiques par période générées avec succès.");
        } else {
          console.log("Aucune statistique à générer pour la période.");
        }
      } catch (err) {
        console.error("Erreur lors de la génération initiale des statistiques :", err.message);
      }
    } else if (statsCount === 0) {
      // Si accidents non vide mais stats vide/inexistante, insérer les stats
      try {
        const accidents = await Accident.find();
        const crashPerPeriod = crash_current(accidents);
        if (crashPerPeriod.length > 0) {
          await statModel.insertMany(crashPerPeriod);
          console.log("Statistiques par période générées avec succès.");
        } else {
          console.log("Aucune statistique à générer pour la période.");
        }
      } catch (err) {
        console.error("Erreur lors de la génération initiale des statistiques :", err.message);
      }
    } else {
      console.log("Les collections 'accidents' et 'stats' existent et ne sont pas vides. Aucun import initial nécessaire.");
    }

    // Lancer le serveur après l'initialisation
    const PORT = process.env.PORT || 3010;
    app.listen(PORT, () => {
      console.log(`Serveur lancé sur http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error("Erreur de connexion à MongoDB", err));

// Planifier une tâche cron pour mettre à jour les données toutes les 1 minute
cron.schedule('*/5 * * * *', async () => {
  console.log("Mise à jour automatique des accidents...");
  try {
    // Envoyer une requête POST pour mettre à jour les données d'accidents
    const response = await axios.post('http://localhost:3010/accidents/update');
    // Envoyer une requête POST pour mettre à jour les statistiques des accidents par période
    const response1 = await axios.post('http://localhost:3010/accidents/crash-per-period/update');
    console.log("Mise à jour terminée des accidents:", response.data.message); // Message de succès
    console.log("Mise à jour terminée des statistiques:", response1.data.message); // Message de succès
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error.message); // Message en cas d'erreur
  }
});