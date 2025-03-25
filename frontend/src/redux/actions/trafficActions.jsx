export const setTrafficData = (data) => ({
    type: "SET_TRAFFIC_DATA",
    payload: data,
  });
  
  export const setZoomLevel = (zoom) => ({
    type: "SET_ZOOM_LEVEL",
    payload: zoom,
  });
  
  export const setSimulationStatus = (status) => ({
    type: "SET_SIMULATION_STATUS",
    payload: status,
  });