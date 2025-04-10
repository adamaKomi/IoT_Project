const express = require("express");
const router = express.Router();
const routingController = require("../controllers/routingController");

// Route pour obtenir les itinéraires alternatifs (ancienne méthode)
router.post("/alternatives", routingController.getAlternativeRoutes);

// Route pour calculer le meilleur itinéraire (ancienne méthode)
router.post("/best-route", routingController.calculateBestRoute);

// Nouvelles routes plus intuitives
router.post("/route", routingController.calculateRoute);
router.post("/alternative-route", routingController.calculateAlternativeRoutes);

module.exports = router;
