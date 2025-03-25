import React, { useEffect } from "react";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useDispatch, useSelector } from "react-redux";
import { setTrafficData } from "../../redux/actions/trafficActions";
import { fetchTrafficData } from "../../services/trafficService";
import ZoomHandler from "./ZoomHandler";

const densityColors = {
  A: "#34A853",
  B: "#A3C644",
  C: "#F4C20D",
  D: "#FB8C00",
  E: "#EA4335",
  F: "#B71C1C",
};

const TrafficMap = () => {
  const dispatch = useDispatch();
  const trafficData = useSelector((state) => state.trafficData);
  const zoomLevel = useSelector((state) => state.zoomLevel);
  const center = [33.687558, -7.376867];
  const UPDATE_INTERVAL = 15000;

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchTrafficData();
      dispatch(setTrafficData(data));
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
        {trafficData.map((line) => (
          <Polyline
            key={`${line.lane_id}-${line.service_level_index}`}
            positions={line.shape}
            color={densityColors[line.service_level_index] || "#000000"}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default TrafficMap;