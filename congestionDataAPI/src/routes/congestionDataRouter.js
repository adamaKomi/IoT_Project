const express = require("express");
const {get_congestionData} = require("../controllers/congestionDataController");



const router = express.Router();

router.get("/congestion-data", get_congestionData);

module.exports = router;