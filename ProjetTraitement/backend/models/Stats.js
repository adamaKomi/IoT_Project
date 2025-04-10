const mongoose = require('mongoose');
const statSchema = new mongoose.Schema({
    on_street_name: { type: String, required: true }, // Ajout de required si le champ est essentiel
    totalInjured: { type: Number,required:true },
    totalKilled: { type: Number, required:true },
    totalAccidents: { type: Number, required:true },
    latitude: { type: Number,required:true },
    longitude: { type: Number,required:true },
    indice_de_risque: { type: Number,required:true },
    riskIndex:{type:Number,required:true},
}); 

module.exports = mongoose.model('Stat', statSchema);
    