import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Tabs from './Tabs';
import AlertsList from './AlertsList';
import RouteDetails from './RouteDetails';
import { parseCoordinates } from '../../utils/utils/parseCoordinates';

const NotificationPanel = () => {
  const [originalRoute, setOriginalRoute] = useState(null);
  const [alternativeRoute, setAlternativeRoute] = useState(null);
  const [startPoint, setStartPoint] = useState("33.689, -7.384");
  const [destination, setDestination] = useState("33.692, -7.381");
  const [activeTab, setActiveTab] = useState('simulation'); // Onglet actif
  const alerts = useSelector((state) => state.trafficData);

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    const startCoords = parseCoordinates(startPoint);
    const destCoords = parseCoordinates(destination);

    if (!startCoords || !destCoords) {
      alert('Format de coordonnées invalide. Utilisez le format: latitude, longitude');
      return;
    }

    try {
      const originalRes = await fetch('/api/routing/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: startCoords, end: destCoords }),
      });
      const originalData = await originalRes.json();
      setOriginalRoute(originalData);

      const altRes = await fetch('/api/routing/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: startCoords, end: destCoords }),
      });
      const alternativeData = await altRes.json();
      setAlternativeRoute(alternativeData);
    } catch (error) {
      console.error('Erreur lors de la récupération des itinéraires:', error);
    }
  };

  const tabs = [
    { id: 'simulation', label: 'Simulation' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'routes', label: 'Itinéraires' },
  ];

  return (
    <div className="notification-panel d-flex flex-column h-100">
      {/* Palette d'onglets */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Contenu des onglets */}
      <div className="tab-content flex-grow-1 overflow-auto">
        {activeTab === 'simulation' && (
          <form onSubmit={handleRouteSubmit} className="mb-3">
            <div className="mb-2">
              <label htmlFor="startPoint" className="form-label">Point de départ</label>
              <input
                type="text"
                id="startPoint"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                className="form-control"
                placeholder="Coordonnées de départ (ex: 33.689, -7.384)"
                required
              />
            </div>
            <div className="mb-2">
              <label htmlFor="destination" className="form-label">Destination</label>
              <input
                type="text"
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="form-control"
                placeholder="Coordonnées de destination (ex: 33.692, -7.381)"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Trouver un itinéraire</button>
          </form>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h5 className="text-center">Alertes de Congestion</h5>
            <div className="overflow-auto mb-3" style={{ maxHeight: '300px' }}>
              <AlertsList alerts={alerts} />
            </div>
          </div>
        )}

        {activeTab === 'routes' && (
          <div>
            <div className="btn-group mb-3" role="group">
              <button
                type="button"
                className={`btn btn-outline-primary ${activeTab === 'originalRoute' ? 'active' : ''}`}
                onClick={() => setActiveTab('originalRoute')}
              >
                Itinéraire initial
              </button>
              <button
                type="button"
                className={`btn btn-outline-primary ${activeTab === 'alternativeRoute' ? 'active' : ''}`}
                onClick={() => setActiveTab('alternativeRoute')}
              >
                Itinéraire alternatif
              </button>
            </div>
            {activeTab === 'originalRoute' && <RouteDetails routeData={originalRoute} isOriginal={true} />}
            {activeTab === 'alternativeRoute' && <RouteDetails routeData={alternativeRoute} isOriginal={false} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;