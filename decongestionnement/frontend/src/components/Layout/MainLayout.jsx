import React from "react";
import TrafficMap from "../Map/TrafficMap";
import SimulationDashboard from "../Simulation/SimulationDashboard";
import NotificationPanel from "../Simulation/NotificationPanel";

const MainLayout = () => {
  return (
    <div className="main-layout vh-100 d-flex flex-column p-3" style={{ backgroundColor: "darkslategrey" }}>
      {/* En-tête avec titre et bouton d'accidents */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="main-layout-title text-white mb-0">Gestion de la congestion du trafic routier</h1>
        <a 
          href="http://localhost:5173/" 
          className="btn btn-outline-warning btn-sm" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <i className="bi bi-exclamation-triangle me-2"></i>
          Voir les données sur les accidents
        </a>
      </div>

      <div className="main-layout-content row flex-grow-1 g-3">
        {/* Carte */}
        <div className="main-layout-map col-md-8 h-100">
          <div className="main-layout-card card h-100 shadow p-0 m-0 border-0">
            <div className="main-layout-card-body card-body m-0" style={{ backgroundColor: "darkslategrey" }}>
              <TrafficMap />
            </div>
          </div>
        </div>

        {/* Contrôles et notifications */}
        <div className="main-layout-controls col-md-4 h-100 d-flex flex-column">
          <div className="main-layout-card card h-100 shadow">
            <div className="main-layout-card-header card-header bg-primary text-white">
              <h5 className="main-layout-card-title mb-0">Tableau de bord</h5>
            </div>
            <div className="main-layout-card-body-scrollable card-body d-flex flex-column overflow-auto">
              <SimulationDashboard />
              <NotificationPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;