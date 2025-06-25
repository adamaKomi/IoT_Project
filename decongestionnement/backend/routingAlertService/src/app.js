const express = require("express");
const cors = require("cors");
const path = require("path");

const alertRoutes = require("./routes/alertRoutes");


const app = express();

// Activation de CORS pour toutes les requêtes
app.use(cors());

// Permet d'analyser le JSON dans les requêtes
app.use(express.json());

// Routes
app.use("/api/alerts", alertRoutes);


// Middleware de gestion d'erreur
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: err.message
  });
});

module.exports = app;