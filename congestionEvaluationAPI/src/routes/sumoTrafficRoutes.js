const express = require("express");
const { congestionDataToDB } = require("../controllers/sumoTrafficController");

const router = express.Router();

router.post("/simulation-data", congestionDataToDB);

module.exports = router;
