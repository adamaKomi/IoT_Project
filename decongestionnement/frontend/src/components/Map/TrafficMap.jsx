import React, { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useDispatch, useSelector } from "react-redux";
import { setTrafficData } from "../../redux/actions/trafficActions";
import { fetchTrafficData } from "../../services/trafficService";
import ZoomHandler from "./ZoomHandler";
import L from "leaflet";

const TrafficMap = () => {
  const dispatch = useDispatch();
  const trafficData = useSelector((state) => state.trafficData);
  const zoomLevel = useSelector((state) => state.zoomLevel);
  const center = [33.687558, -7.376867];
  const UPDATE_INTERVAL = 15000;

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTrafficData();
        dispatch(setTrafficData(data));
      } catch (error) {
        console.error("Erreur lors du chargement des données de trafic :", error);
      }
    };

    loadData();
    const interval = setInterval(loadData, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <div className="h-100">
      <MapContainer center={center} zoom={zoomLevel} className="h-100 w-100">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <ZoomHandler />

        {/* Affichage des lignes et des markers */}
        {trafficData.map((line) => {
          // Création d'une icône personnalisée pour le marker (style Google Maps)
          const markerIcon = new L.Icon({
            iconUrl: `data:image/svg+xml;base64,${btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 24 24">
                <path d="M12 0C7.589 0 4 3.589 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.411-3.589-8-8-8zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" fill="${line.color}" />
              </svg>
            `)}`,
            iconSize: [20, 30], // Taille réduite du marker
            iconAnchor: [10, 30], // Point d'ancrage (bas du marker)
          });

          // Calcul de la position centrale de la ligne
          const middleIndex = Math.floor(line.shape.length / 2);
          const middlePosition = line.shape[middleIndex];

          return (
            <React.Fragment key={`${line.lane_id}-${line.congestionLevel}`}>
              {/* Affichage de la ligne */}
              <Polyline positions={line.shape} color={line.color} />

              {/* Affichage du marker si congestionLevel >= "D" */}
              {line.congestionLevel > "E" && (
                <Marker position={middlePosition} icon={markerIcon}>
                  <Popup>
                    <strong>Congestion Niveau {line.congestionLevel}</strong>
                    <p>Lane ID: {line.lane_id}</p>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default TrafficMap;