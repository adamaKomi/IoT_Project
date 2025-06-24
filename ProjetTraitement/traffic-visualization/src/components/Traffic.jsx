import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Circle, Popup, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { useNavigate } from "react-router-dom"; // Importez useNavigate
const API_BASE_URL = "http://localhost:3010/accidents";


// Composant personnalisé pour la heatmap
const HeatmapLayerCustom = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || !Array.isArray(points) || points.length === 0) return;

    // Filtrer les points invalides et formater pour leaflet.heat
    const validPoints = points
      .filter((point) => 
        typeof point.lat === "number" && 
        !isNaN(point.lat) && 
        typeof point.lng === "number" && 
        !isNaN(point.lng) && 
        typeof point.intensity === "number" && 
        !isNaN(point.intensity)
      )
      .map((point) => [point.lat, point.lng, point.intensity]);

    if (validPoints.length === 0) return;

    const heatLayer = L.heatLayer(validPoints, {
      radius: 20,
      max: 100,
      minOpacity: 0.3,
      gradient: { 0.4: "green", 0.65: "yellow", 1: "red" },
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

const TrafficMap = () => {
  const navigate = useNavigate();
  console.log('TrafficMap rendu, URL actuelle :', window.location.pathname);

  const handleNavigation = (url) => {
    console.log('Navigation vers :', url);
    navigate(url);
  };
  const [view, setView] = useState("TrafficAccidents");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    let endpoint = "";

    switch (view) {
      case "heatmap":
        endpoint = "/crash-per-period";
        break;
      case "dangerous-zones":
        endpoint = "/top-dangerous-zones";
        break;
      case "TrafficAccidents":
        endpoint = "/crash-per-period";
        break;
      default:
        setLoading(false);
        return;
    }

    fetch(`${API_BASE_URL}${endpoint}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(Array.isArray(json) ? json : []); // Garantir un tableau
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des données", err);
        setError(err.message);
        setLoading(false);
      });
  }, [view]);

  const calculateCenter = (data) => {
    if (!Array.isArray(data) || data.length === 0) return [40.7128, -74.006];
    const validData = data.filter(
      (item) => item.latitude !== undefined && item.longitude !== undefined
    );
    if (validData.length === 0) return [40.7128, -74.006];
    const sumLat = validData.reduce((sum, item) => sum + parseFloat(item.latitude), 0);
    const sumLng = validData.reduce((sum, item) => sum + parseFloat(item.longitude), 0);
    return [sumLat / validData.length, sumLng / validData.length];
  };

  const getRiskColor = (risk) => {
    if (risk >= 75) return "red";
    else if (risk >= 50) return "orange";
    else if (risk >= 25) return "yellow";
    else return "green";
  };

  const getCircleRadius = (risk) => {
    if (!risk || risk === 0) return 0;
    else if (risk <= 100 && risk >80) return 400;
    else if (risk <= 80 && risk >60) return 200;
    else if (risk <= 60 && risk >50) return 120;
    else if (risk <= 50 && risk >40) return 90;
    else if (risk <= 40 && risk >30) return 80;
    else if (risk <= 30 && risk >20) return 70;
    else if (risk <= 20 && risk >10) return 60;
    else return 30;
  };

  const renderMapContent = () => {
    if (loading || error || !Array.isArray(data) || data.length === 0) return null;

    switch (view) {
      case "heatmap":
        const heatmapPoints = data.map((zone) => ({
          lat: parseFloat(zone.latitude),
          lng: parseFloat(zone.longitude),
          intensity: parseFloat( zone.freq || 0),
        }));
        return <HeatmapLayerCustom points={heatmapPoints} />;

      case "dangerous-zones":
        return data.map((zone, index) => (
          <Marker
            key={index}
            position={[parseFloat(zone.latitude), parseFloat(zone.longitude)]}
          >
            <Popup>
              <b>{zone.on_street_name}</b>
              <br />
              Accidents: {zone.totalAccidents}
              <br />
              Blessés: {zone.totalInjured}
              <br />
              Tués: {zone.totalKilled}
              <br />
              Risque: {(zone.riskPercentage)}%
            </Popup>
          </Marker>
        ));

      
      case "TrafficAccidents":
        return data.map((accident, index) => (
          <Circle
            key={index}
            center={[parseFloat(accident.latitude), parseFloat(accident.longitude)]}
            radius={getCircleRadius(accident.indice_de_risque)}
            color={getRiskColor(accident.indice_de_risque)}
            fillOpacity={0.5}
          >
            <Popup>
              <b>{accident.on_street_name}</b>
              <br />
              Accidents: {accident.totalAccidents}
              <br />
              Blessés: {accident.totalInjured}
              <br />
              Tués: {accident.totalKilled }
              <br />
              Risque: {accident.indice_de_risque}%
            </Popup>
          </Circle>
        ));

      default:
        return null;
    }
  };

  const center = calculateCenter(data);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        {["heatmap", "dangerous-zones", "TrafficAccidents"].map((type) => (
          <React.Fragment key={type}>
            <button
              onClick={() => setView(type)}
              style={{
                margin: "0 5px",
                padding: "10px",
                backgroundColor: view === type ? "#ddd" : "#fff",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              {type === "heatmap"
                ? "Carte de chaleur"
                : type === "dangerous-zones"
                ? "Zones dangereuses"
                : "TrafficAccidents"}
            </button>
           
          </React.Fragment>

        ))}
       <button
          onClick={() => handleNavigation('predictions')} // Changer '/predictions' en 'predictions'
          style={{
            margin: "0 5px",
            padding: "10px",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Voir les prédictions
        </button>
        <button
  onClick={() => handleNavigation('path')} // Changer '/path' en 'path'
  style={{
    margin: "0 5px",
    padding: "10px",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    cursor: "pointer",
  }}
>
  Voir le chemin
</button>

      </div>

      {loading && <p>Chargement des données...</p>}
      {error && <p style={{ color: "red" }}>Erreur: {error}</p>}
      {!loading && !error && (!Array.isArray(data) || data.length === 0) && (
        <p>Aucune donnée disponible.</p>
      )}

     
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "600px", width: "1500px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {renderMapContent()}
      </MapContainer>
    </div>
  );
};

export default TrafficMap;