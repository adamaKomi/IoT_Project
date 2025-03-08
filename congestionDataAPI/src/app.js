const express = require("express");
const cors = require("cors");

const congestionRoute = require("./routes/congestionDataRouter");

const app = express();

// Activation de CORS pour toutes les requêtes
app.use(cors());
// Permet d'analyser le JSON dans les requêtes
app.use(express.json());

app.use("/api", congestionRoute);

module.exports = app;