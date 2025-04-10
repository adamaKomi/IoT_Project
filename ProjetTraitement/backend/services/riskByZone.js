// Fonction pour calculer le risque par zone à partir des données d'accidents
function calculateRiskByZone(accidents) {
    // Utiliser le nom de la rue (on_street_name) comme identifiant de la zone
    const riskByZone = accidents.reduce((acc, accident) => {
        const zone = accident.on_street_name; // Identifier la zone par le nom de la rue

        // Si la zone n'existe pas encore dans l'objet accumulé, l'initialiser
        if (!acc[zone]) {
            acc[zone] = {
                accidentsCount: 0, // Nombre total d'accidents dans la zone
                risque: 0, // Indice de risque pour la zone
                injuries: 0, // Nombre total de blessés dans la zone
                deaths: 0, // Nombre total de décès dans la zone
                latitude: accident.latitude, // Latitude de la zone
                longitude: accident.longitude, // Longitude de la zone
                freq: 0 // Fréquence des accidents dans la zone
            };
        }

        // Mettre à jour les statistiques pour la zone
        acc[zone].accidentsCount += 1; // Incrémenter le nombre d'accidents
        acc[zone].injuries += accident.number_of_persons_injured; // Ajouter le nombre de blessés
        acc[zone].deaths += accident.number_of_persons_killed; // Ajouter le nombre de décès

        return acc; // Retourner l'objet accumulé
    }, {}); // Initialiser l'objet accumulé comme un objet vide

    // Calculer le nombre total d'accidents pour toutes les zones
    let totalAccidents = 0;
    Object.keys(riskByZone).forEach(zone => {
        totalAccidents += riskByZone[zone].accidentsCount; // Ajouter le nombre d'accidents de chaque zone
    });

    // Calculer la fréquence et l'indice de risque pour chaque zone
    Object.keys(riskByZone).forEach(zone => {
        // Fréquence des accidents dans la zone (proportion par rapport au total)
        riskByZone[zone].freq = (riskByZone[zone].accidentsCount / totalAccidents);
        // Calcul de l'indice de risque : accidents + (blessés * 3) + (décès * 5)
        riskByZone[zone].risque = (
            riskByZone[zone].accidentsCount +
            riskByZone[zone].injuries * 3 +
            riskByZone[zone].deaths * 5
        );
    });

    // Retourner l'objet contenant les statistiques de risque par zone
    return riskByZone;
}

// Exporter la fonction pour l'utiliser dans d'autres fichiers
module.exports = calculateRiskByZone;