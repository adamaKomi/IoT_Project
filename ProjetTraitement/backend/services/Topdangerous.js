// Fonction pour obtenir les N zones les plus dangereuses à partir des données d'accidents
function getTopNDangerousZones(accidentsByZone, n) {
    // Convertir l'objet des zones en tableau d'entrées, trier par indice de risque décroissant, et prendre les N premiers
    const sortedZones = Object.entries(accidentsByZone) // Convertir l'objet en tableau [clé, valeur]
        .sort(([, a], [, b]) => (b.indice_de_risque || 0) - (a.indice_de_risque || 0)) // Trier par indice de risque décroissant
        .slice(0, n); // Garder uniquement les N premières zones

    // Mapper les zones triées pour formater les données de sortie
    return sortedZones.map(([on_street_name, data]) => ({
        on_street_name: data.on_street_name, // Nom de la rue ou zone
        totalAccidents: data.totalAccidents, // Nombre total d'accidents
        totalInjured: data.totalInjured, // Nombre total de blessés
        totalKilled: data.totalKilled, // Nombre total de tués
        riskIndex: data.riskIndex, // Indice brut de risque
        latitude: data.latitude, // Latitude de la zone
        longitude: data.longitude, // Longitude de la zone
        riskPercentage: Number((data.indice_de_risque || 0).toFixed(2)) // Indice de risque normalisé (arrondi à 2 décimales)
    }));
}

// Exporter la fonction pour l'utiliser dans d'autres fichiers
module.exports = getTopNDangerousZones;