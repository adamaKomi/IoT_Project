// Fonction pour analyser les accidents des N dernières années par zone
function analyzeLastNYearsAccidentsByZone(accidents, n) {
  // Vérifier que le paramètre n est un entier positif
  if (!Number.isInteger(n) || n <= 0) {
      throw new Error("Le paramètre n doit être un entier positif.");
  }

  // Définir l'année courante et les limites temporelles pour les N dernières années
  const currentYear = new Date().getFullYear(); // Année actuelle (2025 dans ce cas)
  const startYear = currentYear - n + 1; // Année de début (ex : si n=3, startYear = 2023)
  const startOfPeriod = new Date(`${startYear}-01-01T00:00:00.000Z`); // Début de la période
  const endOfPeriod = new Date(`${currentYear}-12-31T23:59:59.999Z`); // Fin de la période

  // Filtrer les accidents qui se sont produits dans les N dernières années
  const lastNYearsAccidents = accidents.filter(accident => {
      const crashDate = new Date(accident.crash_date); // Convertir la date de l'accident en objet Date
      return crashDate >= startOfPeriod && crashDate <= endOfPeriod; // Garder les accidents dans la période
  });

  // Si aucun accident n'est trouvé dans la période
  if (lastNYearsAccidents.length === 0) {
      return {
          message: `Aucun accident trouvé pour les ${n} dernières années (de ${startYear} à ${currentYear}).`,
          totalAccidents: 0 // Aucun accident trouvé
      };
  }

  // Initialiser les statistiques globales
  const stats = {
      totalAccidents: lastNYearsAccidents.length, // Nombre total d'accidents
      totalInjured: 0, // Nombre total de blessés
      totalKilled: 0, // Nombre total de tués
      accidentsByYear: {} // Statistiques par année
  };

  // Parcourir chaque accident pour calculer les statistiques
  lastNYearsAccidents.forEach(accident => {
      // Ajouter au total global des blessés et des tués
      stats.totalInjured += accident.number_of_persons_injured || 0; // Ajouter les blessés (0 par défaut)
      stats.totalKilled += accident.number_of_persons_killed || 0; // Ajouter les tués (0 par défaut)

      // Extraire l'année de l'accident
      const crashYear = new Date(accident.crash_date).getFullYear();
      if (!stats.accidentsByYear[crashYear]) {
          // Initialiser les statistiques pour cette année si elles n'existent pas encore
          stats.accidentsByYear[crashYear] = {
              totalAccidents: 0, // Nombre total d'accidents pour l'année
              totalInjured: 0, // Nombre total de blessés pour l'année
              totalKilled: 0, // Nombre total de tués pour l'année
              accidentsByZone: {} // Statistiques par zone pour l'année
          };
      }

      // Mettre à jour les statistiques pour l'année
      const yearStats = stats.accidentsByYear[crashYear];
      yearStats.totalAccidents += 1; // Incrémenter le nombre d'accidents
      yearStats.totalInjured += accident.number_of_persons_injured || 0; // Ajouter les blessés
      yearStats.totalKilled += accident.number_of_persons_killed || 0; // Ajouter les tués

      // Identifier la zone de l'accident (nom de rue ou "Zone non spécifiée")
      const zone = accident.on_street_name || "Zone non spécifiée";
      if (!yearStats.accidentsByZone[zone]) {
          // Initialiser les statistiques pour cette zone si elles n'existent pas encore
          yearStats.accidentsByZone[zone] = {
              totalAccidents: 0, // Nombre total d'accidents pour la zone
              totalInjured: 0, // Nombre total de blessés pour la zone
              totalKilled: 0, // Nombre total de tués pour la zone
              longitude: accident.longitude, // Longitude de la zone
              latitude: accident.latitude // Latitude de la zone
          };
      }

      // Mettre à jour les statistiques pour la zone dans l'année
      const zoneStats = yearStats.accidentsByZone[zone];
      zoneStats.totalAccidents += 1; // Incrémenter le nombre d'accidents
      zoneStats.totalInjured += accident.number_of_persons_injured || 0; // Ajouter les blessés
      zoneStats.totalKilled += accident.number_of_persons_killed || 0; // Ajouter les tués
  });

  // Retourner les statistiques calculées
  return stats;
}

// Exporter la fonction pour l'utiliser dans d'autres fichiers
module.exports = analyzeLastNYearsAccidentsByZone;