// Importation des modules nécessaires
const express = require('express'); // Framework pour créer des applications web et API
const Accident = require('../models/Accident'); // Modèle pour les données d'accidents
const statModel = require('../models/Stats'); // Modèle pour les statistiques
const fetchNYCAccidentData = require('../services/fetchNYCData'); // Service pour récupérer les données d'accidents de NYC
const cleanAccidentData = require('../services/cleanData'); // Service pour nettoyer les données d'accidents
const calculateRiskByZone = require('../services/riskByZone'); // Service pour calculer le risque par zone
const calculateRiskByHourAndZone = require('../services/riskByHourAndZone'); // Service pour calculer le risque par heure et zone
const crash_current = require('../services/CrashperPeriod'); // Service pour calculer les accidents par période
const crashModel = require('../models/AccidentbyHour'); // Modèle pour les accidents par heure
const topZone = require('../services/Topdangerous'); // Service pour identifier les zones les plus dangereuses
const router = express.Router(); // Création d'un routeur Express

// Route pour récupérer tous les accidents, triés par date décroissante
router.get('/', async (req, res) => {
    try {
        const accidents = await Accident.find().sort({ crash_date: -1 });
        res.status(200).json(accidents);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération", error: err.message });
    }
});

// Route pour récupérer les statistiques des accidents par période
router.get('/crash-per-period', async (req, res) => {
    try {
        const crashPerPeriod = await statModel.find();
        res.status(200).json(crashPerPeriod);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors du calcul du crash par période", error: err.message });
    }
});


// Route pour calculer le risque par zone
router.get('/risk-by-zone', async (req, res) => {
    try {
        const accidents = await Accident.find();
        const riskByZone = calculateRiskByZone(accidents);
        res.status(200).json(riskByZone);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors du calcul du risque par zone", error: err.message });
    }
});

// Route pour récupérer les zones les plus dangereuses
router.get('/top-dangerous-zones', async (req, res) => {
    try {
        const crashPerPeriod = await statModel.find();
        const topZones = topZone(crashPerPeriod, 10); // Top 10 des zones les plus dangereuses
        console.log("topZones :", topZones);
        res.status(200).json(topZones);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors du calcul du top des zones les plus dangereuses", error: err.message });
    }
});

// Route pour calculer le risque par heure et zone
router.get('/risk-by-hour-and-zone', async (req, res) => {
    try {
        const accidents = await Accident.find();
        const riskByHourAndZone = calculateRiskByHourAndZone(accidents);
        res.status(200).json(riskByHourAndZone);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors du calcul du risque par heure et zone", error: err.message });
    }
});

// Route pour importer et nettoyer les données d'accidents
router.post('/', async (req, res) => {
    try {
        const rawData = await fetchNYCAccidentData(); // Récupération des données brutes
        const cleanedData = await cleanAccidentData(rawData); // Nettoyage des données
        await Accident.insertMany(cleanedData); // Insertion des données nettoyées dans MongoDB
        res.status(201).json({ 
            message: 'Accidents importés et traités avec succès', 
            accidentCount: cleanedData.length, 
        });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de l'importation", error: err.message });
    }
});

// Route pour calculer et insérer les statistiques des accidents par période
router.post('/crash-per-period', async (req, res) => {
    try {
        const accidents = await Accident.find();
        const crashPerPeriod = crash_current(accidents);
        statModel.insertMany(crashPerPeriod);
        res.status(200).json({ message: "Crash par période inséré avec succès" });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors du calcul du crash par période", error: err.message });
    }
});

// Route pour calculer et insérer le risque par heure et zone
router.post('/risk-by-hour-and-zone', async (req, res) => {
    try {
        const accidents = await Accident.find();
        const riskByHourAndZone = calculateRiskByHourAndZone(accidents);
        await crashModel.insertMany(riskByHourAndZone);
        res.status(200).json({ message: "Risque par heure et zone inséré avec succès" });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de l'insertion du risque par heure et zone", error: err.message });
    }
});

// Route pour mettre à jour les données d'accidents avec de nouvelles entrées
router.post('/update', async (req, res) => {
    try {
        const existingIds = new Set(await Accident.distinct("collision_id")); // Récupération des IDs existants
        const rawData = await fetchNYCAccidentData();
        const cleanedData = await cleanAccidentData(rawData);
        const newAccidents = cleanedData.filter(accident => 
            accident.collision_id && !existingIds.has(accident.collision_id)
        ); // Filtrage des nouveaux accidents
        if (newAccidents.length === 0) {
            return res.status(200).json({ message: "Aucun nouvel accident à ajouter" });
        }
        await Accident.insertMany(newAccidents); // Insertion des nouveaux accidents
        res.status(201).json({ 
            message: "Mise à jour terminée", 
            newAccidentsCount: newAccidents.length, 
        });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la mise à jour", error: err.message });
    }
});

// Route pour mettre à jour le risque par zone
router.post('/risk-by-zone/update', async (req, res) => {
    try {
        const accidents = await Accident.find();
        const riskByZone = calculateRiskByZone(accidents);
        await statModel.replaceOne({}, riskByZone, { upsert: true }); // Mise à jour ou insertion
        res.status(200).json({ message: "Risque par zone mis à jour avec succès" });
    } catch (err) {
        console.error("Erreur lors de la mise à jour du risque par zone :", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour", error: err.message });
    }
});

// Route pour mettre à jour les statistiques des accidents par période
router.post('/crash-per-period/update', async (req, res) => {
    try {
        const accidents = await Accident.find();
        const crashPerPeriod = crash_current(accidents);
        const filter = {}; // Document unique
        const update = { $set: crashPerPeriod };
        const options = { upsert: true, new: true }; // Upsert = insérer si inexistant
        const result = await statModel.findOneAndUpdate(filter, update, options);
        res.status(200).json({ message: "Crash par période mis à jour avec succès", data: result });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la mise à jour", error: err.message });
    }
});

// Exportation du routeur pour l'utiliser dans l'application principale
module.exports = router;