export const setTrafficData = (data) =>{
    return{
        type: "SET_TRAFFIC_DATA",
        payload: data,
    };
};


export const setZoom = (data) =>{
    return{
        type: "SET_ZOOM",
        payload: data,
    };
};


export const setStartSimulation = (data) =>{
    return{
        type: "SET_START_SIMULATION",
        payload: data,
    }
}
