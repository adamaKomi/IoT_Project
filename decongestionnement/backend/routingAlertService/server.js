require("dotenv").config();
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const app = require("./src/app");
const { connectDB } = require("./src/config/db/database");

const PORT = process.env.PORT || 4200;

app.use(cors());

// Ajout de logs pour le débogage
console.log("***** DÉMARRAGE DU SERVICE D'ALERTES DE CONGESTION *****");
console.log(`Configuration du port: ${PORT}`);

// Création du serveur HTTP
const server = http.createServer(app);
 
// Configuration du serveur WebSocket avec Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*", // Permet toutes les origines en développement
    methods: ["GET", "POST"]
  }
});

// Partage l'instance io avec toute l'application
app.set("socketio", io);

// Gestion des connexions WebSocket
io.on("connection", (socket) => {
  console.log("Nouvelle connexion client:", socket.id);
  
  // Envoyer un message de bienvenue
  socket.emit("welcome", { message: "Connecté au service d'alerte de congestion" });
  
  // Gérer la déconnexion
  socket.on("disconnect", () => {
    console.log("Client déconnecté:", socket.id);
  });
});

const startServer = async() => {
  try {
    // Connexion à la base de données
    console.log("Tentative de connexion à la base de données...");
    await connectDB();
    
    // Démarrage du serveur
    server.listen(PORT, () => {
      console.log(`Serveur d'alertes de congestion en cours d'exécution sur http://127.0.0.1:${PORT}`);
      console.log("Le serveur est prêt à recevoir des requêtes");
    });
  } catch (error) {
    console.error("Erreur au démarrage du serveur:", error);
    process.exit(1);
  }
};

console.log("Lancement du serveur...");
startServer();
