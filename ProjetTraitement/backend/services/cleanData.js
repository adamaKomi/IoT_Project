// Fonction pour nettoyer les données brutes d'accidents
const cleanAccidentData = async (rawData) => {
    const cleanedData = []; // Tableau pour stocker les données nettoyées

    // Parcourir chaque accident dans les données brutes
    for (const accident of rawData) {
        try {
            // Déstructuration des propriétés nécessaires de l'accident
            const {
                on_street_name, // Nom de la rue
                borough, // Arrondissement
                crash_date, // Date de l'accident
                crash_time, // Heure de l'accident
                collision_id, // Identifiant unique de l'accident
                latitude, // Latitude de l'accident
                longitude, // Longitude de l'accident
                number_of_persons_injured, // Nombre de personnes blessées
                number_of_persons_killed, // Nombre de personnes tuées
                contributing_factor_vehicle_1, // Facteur contributif du véhicule 1
                vehicle_type_code1 // Type de véhicule impliqué
            } = accident;

            // Vérifier si les données essentielles sont présentes
            if (!collision_id || (!on_street_name && !borough) || !longitude || !latitude) {
                // Si l'identifiant ou les coordonnées sont manquants, ignorer cet accident
                continue;
            }

            // Nettoyer et formater les données
            let nameStreet = on_street_name?.trim() || borough?.trim(); // Utiliser le nom de la rue ou l'arrondissement
            let lat = Number(latitude); // Convertir la latitude en nombre
            let lon = Number(longitude); // Convertir la longitude en nombre

            // Vérifier si les coordonnées sont valides
            if (lat === 0 || lon === 0) {
                continue; // Ignorer les accidents avec des coordonnées invalides
            }

            // Ajouter les données nettoyées au tableau
            cleanedData.push({
                collision_id, // Identifiant unique
                crash_date: crash_date ? new Date(crash_date) : null, // Convertir la date en objet Date
                crash_time: crash_time, // Heure de l'accident
                on_street_name: nameStreet, // Nom de la rue ou arrondissement
                number_of_persons_injured: Number(number_of_persons_injured) || 0, // Nombre de blessés (par défaut 0)
                number_of_persons_killed: Number(number_of_persons_killed) || 0, // Nombre de tués (par défaut 0)
                contributing_factor_vehicle_1: contributing_factor_vehicle_1?.trim(), // Facteur contributif nettoyé
                vehicle_type_code1: vehicle_type_code1?.trim(), // Type de véhicule nettoyé
                latitude: lat, // Latitude
                longitude: lon // Longitude
            });

        } catch (error) {
            // Gérer les erreurs lors du traitement d'un accident
            console.warn(`Erreur traitement accident (collision_id: ${accident.collision_id || "N/A"}) : ${error.message}`);
        }
    }

    // Retourner les données nettoyées
    return cleanedData;
};

// Exporter la fonction pour l'utiliser dans d'autres fichiers
module.exports = cleanAccidentData;