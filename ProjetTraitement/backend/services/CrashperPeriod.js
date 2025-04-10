// Fonction pour calculer les statistiques des accidents pour l'année en cours
function calculateStatistics(accidents) {
    // Obtenir l'année actuelle
    const currentYear = new Date().getFullYear();
    // Définir le début de l'année (1er janvier)
    const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    // Définir la fin de l'année (31 décembre)
    const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

    // Filtrer les accidents qui se sont produits pendant l'année en cours
    const currentYearAccidents = accidents.filter(accident => {
        const crashDate = new Date(accident.crash_date); // Convertir la date de l'accident en objet Date
        return crashDate >= startOfYear && crashDate <= endOfYear; // Garder les accidents dans la période
    });

    // Si aucun accident n'est trouvé pour l'année en cours, retourner un tableau vide
    if (currentYearAccidents.length === 0) {
        return [];
    }

    // Initialiser un objet pour stocker les statistiques par zone
    const stats = {};

    // Parcourir chaque accident pour calculer les statistiques
    currentYearAccidents.forEach(accident => {
        const injured = accident.number_of_persons_injured || 0; // Nombre de blessés (0 par défaut)
        const killed = accident.number_of_persons_killed || 0; // Nombre de tués (0 par défaut)
        const on_street_name = accident.on_street_name || "Zone non spécifiée"; // Nom de la rue ou "Zone non spécifiée"

        // Si la zone n'existe pas encore dans les statistiques, l'initialiser
        if (!stats[on_street_name]) {
            stats[on_street_name] = {
                on_street_name, // Nom de la rue
                totalAccidents: 0, // Nombre total d'accidents
                totalInjured: 0, // Nombre total de blessés
                totalKilled: 0, // Nombre total de tués
                latitude: accident.latitude ?? 0, // Latitude de la zone (0 par défaut)
                longitude: accident.longitude ?? 0, // Longitude de la zone (0 par défaut)
                riskIndex: 0, // Indice de risque brut
                indice_de_risque: 0 // Indice de risque normalisé
            };
        }

        // Mettre à jour les statistiques pour la zone
        stats[on_street_name].totalAccidents += 1; // Incrémenter le nombre d'accidents
        stats[on_street_name].totalInjured += injured; // Ajouter les blessés
        stats[on_street_name].totalKilled += killed; // Ajouter les tués
    });

    // Retourner les statistiques calculées
    return stats;
}

// Fonction pour calculer l'indice de risque brut pour chaque zone
function calculateRiskIndex(statsByZone) {
    for (const zone in statsByZone) {
        const zoneData = statsByZone[zone];
        // Calculer l'indice de risque brut : accidents + (blessés * 2) + (tués * 5)
        zoneData.riskIndex = 
            zoneData.totalAccidents + (zoneData.totalInjured * 2) + (zoneData.totalKilled * 5);
    }
}

// Fonction pour normaliser les indices de risque entre 0 et 100
function normalizeRiskIndices(statsByZone) {
    // Extraire tous les indices de risque
    const riskIndices = Object.values(statsByZone).map(zone => zone.riskIndex);
    const maxIndex = Math.max(...riskIndices); // Trouver l'indice de risque maximum
    const minIndex = Math.min(...riskIndices); // Trouver l'indice de risque minimum
    const range = maxIndex - minIndex || 1; // Calculer l'étendue (éviter la division par 0)

    // Normaliser chaque indice de risque
    Object.values(statsByZone).forEach(zone => {
        zone.indice_de_risque = ((zone.riskIndex - minIndex) / range) * 100; // Normalisation entre 0 et 100
    });
}

// Fonction principale pour analyser les accidents de l'année en cours par zone
function analyzeCurrentYearAccidentsByZone(accidents) {
    // Calculer les statistiques par zone
    const statsByZone = calculateStatistics(accidents);
    if (statsByZone.length === 0) {
        return []; // Retourner un tableau vide si aucune statistique n'est trouvée
    }

    // Calculer l'indice de risque brut pour chaque zone
    calculateRiskIndex(statsByZone);
    // Normaliser les indices de risque
    normalizeRiskIndices(statsByZone);

    // Retourner les statistiques sous forme de tableau
    return Object.values(statsByZone);
}

// Exporter la fonction pour l'utiliser dans d'autres fichiers
module.exports = analyzeCurrentYearAccidentsByZone;