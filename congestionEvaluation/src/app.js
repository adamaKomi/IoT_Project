const express = require("express");
const cors = require("cors");

const simulationRoute = require("./routes/sumoTrafficRoutes")

const app = express();

// Middlewares
app.use(cors());  // Activation de CORS pour toutes les requêtes
app.use(express.json());  // Permet d'analyser le JSON dans les requêtes

// Routes
app.use("/api", simulationRoute);


module.exports = app;