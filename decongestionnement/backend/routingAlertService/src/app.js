const express = require("express");
const cors = require("cors");
const path = require("path");

const alertRoutes = require("./routes/alertRoutes");
const routingRoutes = require("./routes/routingRoutes");

const app = express();

// Activation de CORS pour toutes les requêtes
app.use(cors());

// Permet d'analyser le JSON dans les requêtes
app.use(express.json());

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.use("/api/alerts", alertRoutes);
app.use("/api/routing", routingRoutes);

// Route par défaut pour l'interface utilisateur
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Middleware de gestion d'erreur
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: err.message
  });
});

module.exports = app;
