const express = require("express");
const { congestionDataToDB } = require("../controllers/sumoTrafficController");

const router = express.Router();

router.post("/simulation-data", congestionDataToDB);
console.log("Route POST /api/simulation-data enregistrée");

module.exports = router;
