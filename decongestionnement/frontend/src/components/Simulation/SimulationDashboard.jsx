// src/components/Simulation/SimulationDashboard.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSimulationStatus } from "../../redux/actions/trafficActions";
import { startSimulation, stopSimulation, pauseSimulation, resumeSimulation, getSimulationStatus } from "../../services/trafficService";

const SimulationDashboard = () => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState({
    running: false,
    paused: false,
    traci_connected: false,
    current_step: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interval = setInterval(fetchStatus, 2000);
    fetchStatus(); // Appel initial
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await getSimulationStatus();
      setStatus(response.data);
    } catch (error) {
      console.error("Error fetching simulation status:", error);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await startSimulation({ duration: 1000 });
      if (result.status === "success") {
        dispatch(setSimulationStatus(true));
        await fetchStatus();
      } else {
        throw new Error(result.message || "Échec du démarrage de la simulation");
      }
    } catch (error) {
      setError(error.message);
      console.error("Error starting simulation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setError(null);
    try {
      const result = await stopSimulation();
      if (result.status === "success") {
        dispatch(setSimulationStatus(false));
        await fetchStatus();
      } else {
        throw new Error(result.message || "Échec de l'arrêt de la simulation");
      }
    } catch (error) {
      setError(error.message);
      console.error("Error stopping simulation:", error);
    }
  };

  const handlePause = async () => {
    setError(null);
    try {
      const result = await pauseSimulation();
      if (result.status !== "success") {
        throw new Error(result.message || "Échec de la mise en pause");
      }
      await fetchStatus();
    } catch (error) {
      setError(error.message);
      console.error("Error pausing simulation:", error);
    }
  };

  const handleResume = async () => {
    setError(null);
    try {
      const result = await resumeSimulation();
      if (result.status !== "success") {
        throw new Error(result.message || "Échec de la reprise");
      }
      await fetchStatus();
    } catch (error) {
      setError(error.message);
      console.error("Error resuming simulation:", error);
    }
  };

  return (
    <div className="simulation-dashboard mb-4">
      <div className="status-display mb-3 p-3 bg-light rounded">
        <h5>Statut de la simulation</h5>
        <div className="d-flex justify-content-between">
          <span>État: </span>
          <span className={`badge ${status.running ? (status.paused ? 'bg-warning' : 'bg-success') : 'bg-danger'}`}>
            {status.running ? (status.paused ? 'En pause' : 'En cours') : 'Arrêtée'}
          </span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Connecté à SUMO:</span>
          <span className={`badge ${status.traci_connected ? 'bg-success' : 'bg-danger'}`}>
            {status.traci_connected ? 'Oui' : 'Non'}
          </span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Étape actuelle:</span>
          <span>{status.current_step}</span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3">
          {error}
        </div>
      )}

      <div className="controls-grid mb-3">
        <div className="row g-2">
          <div className="col-6">
            <button
              className="btn btn-success w-100"
              onClick={handleStart}
              disabled={status.running || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Démarrage...
                </>
              ) : 'Démarrer'}
            </button>
          </div>
          <div className="col-6">
            <button
              className="btn btn-danger w-100"
              onClick={handleStop}
              disabled={!status.running}
            >
              Arrêter
            </button>
          </div>
          <div className="col-6">
            <button
              className="btn btn-warning w-100"
              onClick={handlePause}
              disabled={!status.running || status.paused}
            >
              Pause
            </button>
          </div>
          <div className="col-6">
            <button
              className="btn btn-info w-100"
              onClick={handleResume}
              disabled={!status.paused}
            >
              Reprendre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationDashboard;