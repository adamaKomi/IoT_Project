const mongoose = require('mongoose');

async function clearDatabase() {
  try {
    await mongoose.connection.dropDatabase();
    console.log('Base de données supprimée avec succès !');
  } catch (error) {
    console.error('Erreur lors de la suppression de la base de données :', error);
  }
}

clearDatabase();
