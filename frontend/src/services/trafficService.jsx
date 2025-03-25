const API_BASE_URL = "http://127.0.0.1:4000";
const SIMULATION_URL = "http://127.0.0.1:5000";

export const fetchTrafficData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/congestion-data`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    return [];
  }
};

export const startSimulation = async () => {
  try {
    const response = await fetch(`${SIMULATION_URL}/start-simulation`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Erreur lors du démarrage de la simulation:", error);
    throw error;
  }
};