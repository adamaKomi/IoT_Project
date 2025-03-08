import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import GetTrafficData from "../data/GetTrafficData";

const densityColors = {
  A: "#34A853", // Vert (Libre)
  B: "#A3C644", // Vert clair (Stable)
  C: "#F4C20D", // Jaune (Modéré)
  D: "#FB8C00", // Orange (Dense)
  E: "#EA4335", // Rouge (Presque saturé)
  F: "#B71C1C"  // Rouge foncé (Saturation)
};

function MapComponent() {
  const center = [33.687558, -7.376867];
  const [trafficData, setTrafficData] = useState([]);
  const [updateKey, setUpdateKey] = useState(Date.now()); // Clé unique po

  const interval = 15000;

  // Fonction pour charger les données
  const loadTrafficData = async () => {
    const data = await GetTrafficData();
    setTrafficData([...data]);
  };

  useEffect(() => {
    // Chargement initial des données
    loadTrafficData();

    // Mise à jour périodique
    const updateInterval = setInterval(() => {
      loadTrafficData();
    }, interval);

    // Nettoyage de l'intervalle au démontage du composant
    return () => clearInterval(updateInterval);
  }, []);

  // useEffect(() => {
  //   console.log("trafficData mis à jour :", trafficData);
  // }, [trafficData]);

  return (
    <MapContainer key={updateKey} center={center} zoom={15} style={{ height: "80vh", width: "80vw" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {/* Affichage des lignes récupérées depuis MongoDB */}
      {trafficData.map((line, index) => (
        <Polyline key={line.lane_id} positions={line.shape} color={densityColors[line.service_level_index] || "#000000"} />
      ))}
    </MapContainer>
  );
}

export default MapComponent;
