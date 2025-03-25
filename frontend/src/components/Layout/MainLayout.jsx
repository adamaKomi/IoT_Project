import React from "react";
import TrafficMap from "../Map/TrafficMap";
import SimulationControls from "../Simulation/SimulationControls";
import NotificationPanel from "../Simulation/NotificationPanel";

const MainLayout = () => {
  return (
    <div className="container-fluid vh-100 d-flex flex-column p-3">
      <h1 className="text-center mb-4">Gestion de la congestion du trafic routier</h1>
      <div className="row flex-grow-1 g-3">
        {/* Carte */}
        <div className="col-md-8 h-100">
          <div className="card h-100 shadow">
            <div className="card-body p-0">
              <TrafficMap />
            </div>
          </div>
        </div>
        {/* Contrôles et notifications */}
        <div className="col-md-4 h-100 d-flex flex-column">
          <div className="card h-100 shadow">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Contrôles et Notifications</h5>
            </div>
            <div className="card-body d-flex flex-column">
              <SimulationControls />
              <NotificationPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;