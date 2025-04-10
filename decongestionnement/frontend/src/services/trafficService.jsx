import { io } from "socket.io-client";
const API_BASE_URL = "http://127.0.0.1:4200";
const SIMULATION_URL = "http://127.0.0.1:5000";


let socket = null;
let pollingInterval = null;

export const fetchTrafficData = async () => {
  try {
    // Récupération initiale des alertes via l'API
    const initialData = await fetchAlerts();

    // Connexion au serveur WebSocket
    socket = io(API_BASE_URL);

    // Gestionnaire de connexion réussie
    socket.on("connect", () => {
      console.log("Connecté au serveur WebSocket");
    });

    // Écoute des mises à jour de congestion en temps réel
    socket.on("congestion_update", async () => {
      console.log("Mise à jour des alertes de congestion reçue");
      const updatedData = await fetchAlerts();
      return updatedData; // Retourne les nouvelles données
    });

    // Polling toutes les 30 secondes
    pollingInterval = setInterval(async () => {
      const polledData = await fetchAlerts();
      return polledData; // Retourne les données récupérées par polling
    }, 30000);

    return initialData; // Retourne les données initiales
  } catch (error) {
    console.error("Erreur lors de l'initialisation de fetchTrafficData:", error);
    return [];
  }
};

// Fonction pour récupérer les alertes de congestion depuis l'API
const fetchAlerts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts/congestion`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("La réponse n'est pas au format JSON");
    }
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération des alertes:", error);
    return [];
  }
};

// Fonction de nettoyage pour arrêter WebSocket et polling
export const cleanupTrafficData = () => {
  if (socket) {
    socket.disconnect(); // Ferme la connexion WebSocket
    socket = null;
  }
  if (pollingInterval) {
    clearInterval(pollingInterval); // Arrête le polling
    pollingInterval = null;
  }
};

export const startSimulation = async (options = {}) => {
  try {
    const response = await fetch(`${SIMULATION_URL}/api/v1/start-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        duration: options.duration || 1000 // Valeur par défaut de 1000 si non spécifié
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erreur lors du démarrage de la simulation:", error);
    throw error;
  }
};

export const stopSimulation = async () => {
  try {
    const response = await fetch(`${SIMULATION_URL}/api/v1/stop-simulation`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de l'arrêt de la simulation:", error);
    throw error;
  }
};

export const pauseSimulation = async () => {
  try {
    const response = await fetch(`${SIMULATION_URL}/api/v1/pause-simulation`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la pause de la simulation:", error);
    throw error;
  }
};

export const resumeSimulation = async () => {
  try {
    const response = await fetch(`${SIMULATION_URL}/api/v1/resume-simulation`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la reprise de la simulation:", error);
    throw error;
  }
};

export const getSimulationStatus = async () => {
  try {
    const response = await fetch(`${SIMULATION_URL}/api/v1/simulation-status`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération du statut:", error);
    throw error;
  }
};