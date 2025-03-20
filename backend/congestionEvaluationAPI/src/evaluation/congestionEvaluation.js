const congestionEvaluation = (data) => {
    // Formater les données
    const formattedData = data.map(item => {
        const lane_id = item.lane_id; // identifiant de la route
        const lane_length = parseFloat(item.lane_length)/1000; // longeur de la route en km
        const max_speed = parseFloat(item.max_speed) * 3.6;     // vitesse maximale en km/h
        const vehicles = item.vehicles; // informations sur les vehicles
        const veh_count = vehicles.length;

        

        // Calculs
        const mean_speed = getMeanSpeed(vehicles, max_speed); // vitesse moyenne en km/h
    
        const density = getDensity(veh_count, lane_length); // densité de la circulation en voitures/km
        const trafficFlow = density * mean_speed; // debit de la circulation
        const travel_time = getTravelTime(lane_length, mean_speed, max_speed); // temps de trajet en minutes
        const occupancy_rate = getOccupancyRate(vehicles, lane_length);
        // const congestion_rate = getCongestionRate(max_speed, mean_speed);
        const service_level_index = getServiceLevelIndex(density);
        // const lane_capacity = getLaneCapacity(vehicles, lane_length);
        const date = new Date(parseFloat(item.timestamp)*1000);
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
            service_level_index,
            // lane_capacity,
            date,
            shape
        };
    });

    return formattedData;
};


const getDensity = (nb_vehicles, lane_length)=>{
    return (nb_vehicles/lane_length);
}

// const getCongestionRate = (max_speed, mean_speed) =>{
//     return (max_speed-mean_speed)/max_speed;
// }


const getOccupancyRate = (vehicles, lane_length) =>{
    const veh_count = vehicles.length; 
    let total_length = 0.0;

    vehicles.forEach(veh =>{
        total_length += parseFloat(veh.length) + parseFloat(veh.minGap)
    })

    return veh_count>0 ? (veh_count*(total_length/1000))/lane_length: 0;
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


const getTravelTime = (lane_length, mean_speed, max_speed) =>{
    travel_time = lane_length/ (mean_speed > 0 ? mean_speed : max_speed);
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



module.exports = {congestionEvaluation};