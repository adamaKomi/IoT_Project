import React, { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useDispatch, useSelector } from "react-redux"; // Importer useDispatch et useSelector
import GetTrafficData from "../data/GetTrafficData";
import { setTrafficData, setZoom, setStartSimulation } from "../../redux/actions/actions";

const densityColors = {
  A: "#34A853", // Vert (Libre)
  B: "#A3C644", // Vert clair (Stable)
  C: "#F4C20D", // Jaune (Modéré)
  D: "#FB8C00", // Orange (Dense)
  E: "#EA4335", // Rouge (Presque saturé)
  F: "#B71C1C"  // Rouge foncé (Saturation)
};

function MapComponent() {
  const dispatch = useDispatch();
  const center = [33.687558, -7.376867];

  // Récupérer l'état global 
  const trafficData = useSelector(state => state.trafficData);
  const zoom = useSelector(state => state.zoom);

  const interval = 15000;

  // Fonction pour charger les données
  const loadTrafficData = async () => {
    const data = await GetTrafficData();
    dispatch(setTrafficData(data)); // Mettre à jour l'état global 
  };

  useEffect(() => {
    loadTrafficData();
    const updateInterval = setInterval(() => {
      loadTrafficData();
    }, interval);
    return () => clearInterval(updateInterval);
  }, [dispatch]);

  // Composant interne pour capturer le zoom
  function ZoomListener() {
    useMapEvents({
      zoomend: (e) => {
        const newZoom = e.target.getZoom();
        dispatch(setZoom(newZoom)); // mettre à jour le zoom dans l'état global
        console.log("Nouveau zoom :", newZoom);
      }
    });
    return null;
  }

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "80vh", width: "80vw" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <ZoomListener />

      {/* Mise à jour des polylignes avec les données de trafic */}
      {trafficData.map((line) => (
        <Polyline
          key={line.lane_id + line.service_level_index}
          positions={line.shape}
          color={densityColors[line.service_level_index] || "#000000"}
        />
      ))}
    </MapContainer>
  );
}

export default MapComponent;
