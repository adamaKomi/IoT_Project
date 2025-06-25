const express = require("express");
const { getCongestionAlerts, subscribeToArea, unsubscribeFromArea } = require("../controllers/alertController");

const router = express.Router();

// Route pour obtenir toutes les alertes de congestion actives
router.get("/congestion", getCongestionAlerts);

module.exports = router;