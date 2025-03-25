import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSimulationStatus } from "../../redux/actions/trafficActions";
import { startSimulation } from "../../services/trafficService";

const SimulationControls = () => {
  const dispatch = useDispatch();
  const isSimulationRunning = useSelector((state) => state.isSimulationRunning);
  const [simulationState, setSimulationState] = useState("stopped");

  const handleStart = useCallback(async () => {
    setSimulationState("starting");
    try {
      await startSimulation();
      dispatch(setSimulationStatus(true));
      setSimulationState("running");
    } catch (error) {
      setSimulationState("stopped");
    }
  }, [dispatch]);

  return (
    <div className="mb-3 p-2 bg-light rounded">
      {simulationState === "stopped" ? (
        <button
          className="btn btn-success btn-lg w-100"
          onClick={handleStart}
          disabled={isSimulationRunning}
        >
          Démarrer la simulation
        </button>
      ) : simulationState === "starting" ? (
        <div className="alert alert-info d-flex align-items-center mb-0">
          <div className="spinner-border spinner-border-sm me-2" role="status" />
          Simulation en cours...
        </div>
      ) : null}
    </div>
  );
};

export default SimulationControls;