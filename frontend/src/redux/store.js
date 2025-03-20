import {createStore} from "redux"

const initialState = {
    trafficData : [],
    zoom : 16,
    startSimulation: false,
}


const trafficReducer = (state = initialState, action) =>{
    switch(action.type){
        case "SET_TRAFFIC_DATA":
            return {
                ...state,
                trafficData: action.payload,
            }
        case "SET_ZOOM":
            return{
                ...state,
                zoom: action.payload,
            }
        case "SET_START_SIMULATION":
            return{
                ...state,
                startSimulation: action.payload,
            }
        default:
            return state;
    }
};


// creer le store

const store = createStore(trafficReducer);

export default store;