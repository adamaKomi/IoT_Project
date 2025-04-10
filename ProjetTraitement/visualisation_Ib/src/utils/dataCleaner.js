// utils/dataCleaner.js
function cleanAccidentData(accident) {
    try {
      // Créer une copie de l'accident pour éviter de modifier l'original
      let cleanedAccident = { ...accident };
  
      // Normaliser les champs texte
      if (cleanedAccident.borough) {
        cleanedAccident.borough = cleanedAccident.borough.trim().toUpperCase();
      }
      if (cleanedAccident.on_street_name) {
        cleanedAccident.on_street_name = cleanedAccident.on_street_name.trim().toUpperCase();
      }
  
      // Valider et calculer le nombre total de personnes blessées
      cleanedAccident.number_of_persons_injured = (
        (parseInt(cleanedAccident.number_of_persons_injured) || 0) 
      );
  
      // Valider et calculer le nombre total de personnes tuées
      cleanedAccident.number_of_persons_killed = (
        (parseInt(cleanedAccident.number_of_persons_killed) || 0) 
      );
  
      // Valider et convertir latitude et longitude
      if (
        cleanedAccident.latitude &&
        cleanedAccident.longitude &&
        !isNaN(parseFloat(cleanedAccident.latitude)) &&
        !isNaN(parseFloat(cleanedAccident.longitude))
      ) {
        cleanedAccident.latitude = parseFloat(cleanedAccident.latitude);
        cleanedAccident.longitude = parseFloat(cleanedAccident.longitude);
      } else {
        cleanedAccident.latitude = null;
        cleanedAccident.longitude = null;
      }
  
      // Supprimer les champs inutiles ou redondants
      const requiredFields = [
        'collision_id', // Ajout de collision_id pour la déduplication
        'crash_date',
        'crash_time',
        'borough',
        'on_street_name',
        'number_of_persons_injured',
        'number_of_persons_killed',
        'contributing_factor_vehicle_1',
        'latitude',
        'longitude'
      ];
      Object.keys(cleanedAccident).forEach(key => {
        if (!requiredFields.includes(key) || (key !== 'borough' && key !== 'on_street_name' && !cleanedAccident[key])) {
          delete cleanedAccident[key];
        }
      });
  
      // Retourner l'accident nettoyé uniquement s'il a des coordonnées valides
      if (cleanedAccident.latitude === null || cleanedAccident.longitude === null) {
        console.warn('Accident filtered out due to invalid coordinates:', cleanedAccident);
        return null;
      }
  
      return cleanedAccident;
    } catch (error) {
      console.error('Erreur lors du nettoyage des données:', error);
      throw error;
    }
  }
  
  module.exports = { cleanAccidentData };