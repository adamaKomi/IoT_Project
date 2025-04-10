const mongoose = require('mongoose');

const AccidentSchema = new mongoose.Schema({
    crash_date: { type: Date, required: true },
    crash_time: { type: String,required:true }, // Ajout d'une valeur par défaut
    on_street_name: { type: String, required: true }, 
    number_of_persons_injured: { type: Number,reuired:true },
    number_of_persons_killed: { type: Number, required:true },
    contributing_factor_vehicle_1: { type: String,reuired:true },
    vehicle_type_code1: { type: String,reuired:true },
    collision_id: { type: String, required: true, unique: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
}, { timestamps: true }); // Ajoute automatiquement createdAt et updatedAt

// Index sur on_street_name pour optimiser les requêtes
AccidentSchema.index({ on_street_name: 1 });

// Exportation des modèles
module.exports =mongoose.model('Accident', AccidentSchema);
