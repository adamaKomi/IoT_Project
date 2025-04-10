const congestionEvaluation = (data) => {
    // Formater les données
    const formattedData = data.map(item => {
        const lane_id = item.lane_id; // identifiant de la route
        const lane_length = parseFloat(item.lane_length) / 1000; // longeur de la route en km
        const max_speed = parseFloat(item.max_speed) * 3.6;     // vitesse maximale en km/h
        const vehicles = item.vehicles; // informations sur les vehicles
        const veh_count = vehicles.length;
        const halting_number = item.halting_number;



        // Calculs
        const mean_speed = getMeanSpeed(vehicles, max_speed); // vitesse moyenne en km/h

        const density = getDensity(veh_count, lane_length); // densité de la circulation en voitures/km
        const trafficFlow = density * mean_speed; // debit de la circulation
        const travel_time = getTravelTime(lane_length, mean_speed, max_speed); // temps de trajet en minutes
        const occupancy_rate = getOccupancyRate(vehicles, lane_length);
        // const congestion_rate = getCongestionRate(max_speed, mean_speed);
        const congestionLevel = getServiceLevelIndex(density);
        // const lane_capacity = getLaneCapacity(vehicles, lane_length);
        const date = new Date(parseFloat(item.timestamp) * 1000);
        const shape = item.shape;


        // Retourner un objet formaté
        return {
            lane_id,
            mean_speed,
            density,
            trafficFlow,
            travel_time,
            occupancy_rate,
            // congestion_rate,
            congestionLevel,
            // lane_capacity,
            date,
            shape,
            message: generateAlertMessage(congestionLevel, lane_id),
            color: densityColors[congestionLevel],
            timestamp: new Date(),
            raw_data: {
                halting_number: halting_number,
                max_speed: max_speed,
                vehicle_count: veh_count, 
            }
        };
    });

    return formattedData;
};


const getDensity = (nb_vehicles, lane_length) => {
    return (nb_vehicles / lane_length);
}

// const getCongestionRate = (max_speed, mean_speed) =>{
//     return (max_speed-mean_speed)/max_speed;
// }


const getOccupancyRate = (vehicles, lane_length) => {
    const veh_count = vehicles.length;
    let total_length = 0.0;

    vehicles.forEach(veh => {
        total_length += parseFloat(veh.length) + parseFloat(veh.minGap)
    })

    return veh_count > 0 ? (veh_count * (total_length / 1000)) / lane_length : 0;
}

const getMeanSpeed = (vehicules, max_speed) => {
    let total_speed = 0.0;
    const veh_count = vehicules.length;

    vehicules.forEach(veh => {
        total_speed += parseFloat(veh.speed);
    });

    // convertir la vitesse de m/s en km/h
    return veh_count > 0 ? (total_speed * 3.6) / veh_count : max_speed;
}


const getTravelTime = (lane_length, mean_speed, max_speed) => {
    travel_time = lane_length / (mean_speed > 0 ? mean_speed : max_speed);
    return travel_time * 60;
}


const getServiceLevelIndex = (density) => {
    if (density < 11) {
        return 'A'; // Libre
    } else if (density >= 11 && density < 18) {
        return 'B'; // Stable
    } else if (density >= 18 && density < 26) {
        return 'C'; // Modéré
    } else if (density >= 26 && density < 35) {
        return 'D'; // Dense
    } else if (density >= 35 && density < 45) {
        return 'E'; // Presque saturé
    } else if (density >= 45) {
        return 'F'; // Saturation
    }
};

// Générer un message d'alerte en fonction du niveau de congestion
function generateAlertMessage(level, laneId) {
    switch (level) {
        case "A":
            return `🚗 Circulation fluide sur la voie ${laneId}. Profitez du trajet !`;
        case "B":
            return `🚙 Circulation stable sur la voie ${laneId}. Aucun ralentissement majeur.`;
        case "C":
            return `⚠️ Trafic modéré sur la voie ${laneId}. Restez attentif.`;
        case "D":
            return `🔴 ATTENTION : Circulation dense sur la voie ${laneId}. Possibles ralentissements.`;
        case "E":
            return `⚠️ ALERTE : La voie ${laneId} est presque saturée. Envisagez un itinéraire alternatif.`;
        case "F":
            return `🚨 URGENCE : La voie ${laneId} est saturée ! Évitez cette zone si possible.`;
        default:
            return `ℹ️ Données de trafic indisponibles pour la voie ${laneId}.`;
    }
}

const densityColors = {
    A: "#34A853",
    B: "#A3C644",
    C: "#F4C20D",
    D: "#FB8C00",
    E: "#EA4335",
    F: "#B71C1C",
};



module.exports = { congestionEvaluation };