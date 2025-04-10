const mongoose = require("mongoose");

const accidentHourSchema = new mongoose.Schema({
    hour:{type:String,required:true},
    zone: {type:String,required:true},
    totalAccidents: {type:Number,required:true},
    totalInjuries:{type:Number,required:true},
    totalDeaths:{type:Number,required:true},
    longitude:{type:Number,required:true},
    latitude:{type:Number,required:true},
    riskScore:{type:Number,required:true}
});

module.exports = mongoose.model("CrashbyHour", accidentHourSchema);
