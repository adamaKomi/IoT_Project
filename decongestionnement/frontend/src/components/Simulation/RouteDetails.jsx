import React from 'react';

const RouteDetails = ({ routeData, isOriginal }) => {
  if (!routeData || !routeData.route) {
    return <p className="text-muted">Itinéraire non disponible.</p>;
  }

  return (
    <div>
      {routeData.route.segments.map((segment, index) => (
        <div key={index} className="mb-3">
          <strong>
            Segment {index + 1}: {segment.name || `Section ${segment.lane_id}`}
          </strong>
          <p>{segment.instruction || 'Suivez cette route'}</p>
          {segment.congestionLevel !== 'green' && (
            <p className="text-danger">Trafic ralenti : {segment.congestionMessage || 'Congestion détectée'}</p>
          )}
        </div>
      ))}
      <div className="mt-3">
        <p><strong>Distance :</strong> {routeData.route.distance.toFixed(1)} km</p>
        <p><strong>Durée :</strong> {Math.round(routeData.route.duration)} min</p>
        <p><strong>Niveau de trafic :</strong> {routeData.route.congestionLevel || 'Normal'}</p>
      </div>
    </div>
  );
};

export default RouteDetails;