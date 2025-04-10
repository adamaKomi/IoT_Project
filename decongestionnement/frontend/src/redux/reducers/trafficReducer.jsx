const initialState = {
    trafficData: [],
    zoomLevel: 16,
    isSimulationRunning: false,
    notifications: []
  };
  
  const trafficReducer = (state = initialState, action) => {
    switch (action.type) {
      case "SET_TRAFFIC_DATA":
        return { ...state, trafficData: action.payload };
      case "SET_ZOOM_LEVEL":
        return { ...state, zoomLevel: action.payload };
      case "SET_SIMULATION_STATUS":
        return { ...state, isSimulationRunning: action.payload };
      case "SET_NOTIFICATION":
        return {...state, notifications: [...state.notifications, action.payload]};
      default:
        return state;
    }
  };
  
  export default trafficReducer;