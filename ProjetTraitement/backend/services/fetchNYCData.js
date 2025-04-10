// Importation du module axios pour effectuer des requêtes HTTP
const axios = require('axios');

// Fonction asynchrone pour récupérer les données d'accidents de NYC
async function fetchNYCAccidentData() {
    try {
        const batchSize = 100000; // Nombre total de données à récupérer
        const chunkSize = 10000; // Taille de chaque requête (nombre d'enregistrements par requête)
        let requests = []; // Tableau pour stocker les requêtes

        // Boucle pour créer plusieurs requêtes avec des offsets
        for (let offset = 0; offset < batchSize; offset += chunkSize) {
            requests.push(
                axios.get('https://data.cityofnewyork.us/resource/h9gi-nx95.json', {
                    params: {
                        $limit: chunkSize, // Limite le nombre d'enregistrements par requête
                        $offset: offset, // Décale les enregistrements pour récupérer les données par lots
                        $where: "crash_date >= '2022-01-01T00:00:00.000'", // Filtre pour récupérer les données à partir de 2022
                        $order: "crash_date DESC" // Trie les données par date décroissante (du plus récent au plus ancien)
                    }
                })
            );
        }

        // Exécuter toutes les requêtes en parallèle
        const responses = await Promise.all(requests);

        // Extraire et concaténer les données de chaque réponse
        const allData = responses.flatMap(response => response.data);

        // Retourner toutes les données récupérées
        return allData;
    } catch (error) {
        // Gérer les erreurs lors de la récupération des données
        console.error("Erreur lors de la récupération des données :", error);
        throw error; // Relancer l'erreur pour la gérer ailleurs
    }
}

// Exporter la fonction pour l'utiliser dans d'autres fichiers
module.exports = fetchNYCAccidentData;