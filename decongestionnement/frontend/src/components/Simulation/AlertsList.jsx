import React from 'react';

const AlertsList = ({ alerts }) => {
  const filteredAlerts = alerts.filter((alert) => alert.congestionLevel >= "D");

  if (filteredAlerts.length === 0) {
    return <p className="text-muted">Aucune alerte de congestion actuellement.</p>;
  }

  return filteredAlerts.map((alert, index) => (
    <div key={index} className="alert alert-warning p-2 mb-1">
      <h6 className="mb-1">Congestion Niveau {alert.congestionLevel}</h6>
      <p className="mb-1 small">{alert.message}</p>
      <small className="text-muted">Détecté à {new Date(alert.timestamp).toLocaleTimeString()}</small>
    </div>
  ));
};

export default AlertsList;