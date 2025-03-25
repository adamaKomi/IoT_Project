import { createStore } from "redux";
import trafficReducer from "../reducers/trafficReducer";

const store = createStore(trafficReducer);
export default store;