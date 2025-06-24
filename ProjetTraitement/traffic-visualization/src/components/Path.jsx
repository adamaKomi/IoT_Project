import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { ratio } from 'fuzzball';
import { FaTimes } from 'react-icons/fa';

// Correction des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [bounds, map]);
  return null;
}

const Path=()=> {
  const userPosition = [40.7501, -73.9749];
  const [destination, setDestination] = useState(null);
  const [streetName, setStreetName] = useState('');
  const [route, setRoute] = useState([]);
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [showAlternativePrompt, setShowAlternativePrompt] = useState(false);
  const [alternativeRoute, setAlternativeRoute] = useState(null);
  const [riskZones, setRiskZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingRisks, setCheckingRisks] = useState(false);
  const [alternativeMessage, setAlternativeMessage] = useState('');
  const [showMainRoute, setShowMainRoute] = useState(false);
  const [evaluatedRoutes, setEvaluatedRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(null);

  const streetNameCache = new Map();

  useEffect(() => {
    const fetchRiskZones = async () => {
      try {
        const startTime = Date.now();
        const response = await axios.get('http://localhost:3003/api/accidents/zones');
        console.log('Données des zones à risque récupérées :', response.data);
        console.log(`Temps de récupération des zones à risque : ${Date.now() - startTime} ms`);
        setRiskZones(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des zones à risque :", error);
        setLoading(false);
      }
    };
    fetchRiskZones();
  }, []);

  const handleGeocode = async () => {
    try {
      setRiskAlerts([]);
      setRoute([]);
      setAlternativeRoute(null);
      setShowAlternativePrompt(false);
      setAlternativeMessage('');
      setEvaluatedRoutes([]);
      setSelectedRouteIndex(null);

      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${streetName},+New+York,+NY`
      );
      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        const newDestination = [parseFloat(lat), parseFloat(lon)];
        setDestination(newDestination);
        fetchAndOptimizeRoute(newDestination);
      } else {
        alert("Adresse non trouvée à New York. Vérifiez le nom de la rue.");
      }
    } catch (error) {
      console.error("Erreur lors du géocodage :", error);
    }
  };

  const fetchRoute = async (destinationCoords, avoidPoints = [], alternatives = false) => {
    try {
      let url;
      if (avoidPoints.length > 0) {
        const validAvoidPoints = avoidPoints.filter(point => 
          Array.isArray(point) && point.length === 2 && !isNaN(point[0]) && !isNaN(point[1])
        );
        if (validAvoidPoints.length === 0) {
          console.warn("Aucun point valide à éviter. Génération d'un itinéraire sans points à éviter.");
          url = `http://router.project-osrm.org/route/v1/driving/${userPosition[1]},${userPosition[0]};${destinationCoords[1]},${destinationCoords[0]}?overview=full&geometries=geojson&alternatives=${alternatives}`;
        } else {
          const waypoints = validAvoidPoints
            .map(point => `${point[1]},${point[0]}`)
            .join(';');
          url = `http://router.project-osrm.org/route/v1/driving/${userPosition[1]},${userPosition[0]};${waypoints};${destinationCoords[1]},${destinationCoords[0]}?overview=full&geometries=geojson&alternatives=${alternatives}`;
        }
      } else {
        url = `http://router.project-osrm.org/route/v1/driving/${userPosition[1]},${userPosition[0]};${destinationCoords[1]},${destinationCoords[0]}?overview=full&geometries=geojson&alternatives=${alternatives}`;
      }

      console.log('URL de la requête OSRM:', url);
      const response = await axios.get(url);

      if (response.data.routes && response.data.routes.length > 0) {
        const routes = response.data.routes.map(route => ({
          coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
          distance: route.distance,
          duration: route.duration,
        }));
        return routes;
      } else {
        console.warn("Aucune route trouvée par OSRM:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du chemin :", error);
      return [];
    }
  };

  const getStreetNamesFromRoute = async (routeCoordinates) => {
    const streetNames = new Set();
    const samplePoints = routeCoordinates.filter((_, index) => index % 10 === 0).slice(0, 5);

    console.log('Points échantillonnés pour le géocodage inversé :', samplePoints);

    const promises = samplePoints.map(async (coord, index) => {
      const cacheKey = `${coord[0]},${coord[1]}`;
      if (streetNameCache.has(cacheKey)) {
        console.log(`Utilisation du cache pour ${cacheKey}: ${streetNameCache.get(cacheKey)}`);
        return streetNameCache.get(cacheKey);
      }

      try {
        await new Promise(resolve => setTimeout(resolve, index * 200));
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coord[0]}&lon=${coord[1]}&addressdetails=1`
        );
        console.log(`Réponse de Nominatim pour ${coord} :`, response.data);
        const address = response.data.address;
        if (address && address.road) {
          const streetName = address.road.toUpperCase();
          streetNameCache.set(cacheKey, streetName);
          return streetName;
        }
        return null;
      } catch (error) {
        console.error(`Erreur lors du géocodage inversé pour ${coord}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    results.forEach(street => {
      if (street) streetNames.add(street);
    });

    console.log('Noms des rues trouvés sur l\'itinéraire :', Array.from(streetNames));
    return Array.from(streetNames);
  };

  const normalizeStreetName = (street) => {
    let normalized = street.toUpperCase();
    normalized = normalized
      .replace(/\b1ST\b/, "FIRST")
      .replace(/\b2ND\b/, "SECOND")
      .replace(/\b3RD\b/, "THIRD")
      .replace(/\b([4-9])TH\b/, "$1TH")
      .replace(/\bFIRST\b/, "1ST")
      .replace(/\bSECOND\b/, "2ND")
      .replace(/\bTHIRD\b/, "3RD");
    return normalized.trim();
  };

  const evaluateRouteRisk = async (routeCoordinates) => {
    const streetNames = await getStreetNamesFromRoute(routeCoordinates);
    const alerts = [];
    const riskyStreets = new Set();
    let highRiskCount = 0;

    console.log('Street names from route:', streetNames);
    console.log('Risk zones data:', riskZones);

    streetNames.forEach(street => {
      const normalizedStreet = normalizeStreetName(street);
      const matchingZone = riskZones.find(zone => {
        const normalizedZoneName = normalizeStreetName(zone.route_name);
        const similarity = ratio(normalizedStreet, normalizedZoneName);
        console.log(
          `Comparing "${normalizedStreet}" with "${normalizedZoneName}" - Similarity: ${similarity}`
        );
        return similarity > 75;
      });

      if (matchingZone) {
        const riskIndex = matchingZone.normalizedRiskIndex;
        console.log(`Matched street: ${street}, RiskIndex: ${riskIndex}`);
        if (riskIndex > 0) {
          alerts.push({
            message: `⚠️ Zone à risque détectée : ${street} (Indice de risque : ${riskIndex.toFixed(2)})`,
            riskIndex: riskIndex,
          });
          riskyStreets.add(street);
          if (riskIndex >= 1) highRiskCount++;
        }
      } else {
        console.log(`No match found for street: ${street}`);
      }
    });

    const riskScore = alerts.reduce((sum, alert) => sum + alert.riskIndex, 0);
    console.log('Generated alerts:', alerts);
    return { alerts, riskyStreets: Array.from(riskyStreets), riskScore, highRiskCount };
  };

  const fetchAndOptimizeRoute = async (destinationCoords) => {
    setCheckingRisks(true);
    setShowMainRoute(false);

    const routes = await fetchRoute(destinationCoords, [], true);
    if (routes.length === 0) {
      setAlternativeMessage("Impossible de trouver un itinéraire.");
      setCheckingRisks(false);
      return;
    }

    const evaluatedRoutes = [];
    for (const route of routes) {
      const { alerts, riskyStreets, riskScore, highRiskCount } = await evaluateRouteRisk(route.coordinates);
      console.log(`Evaluated route alerts:`, alerts);
      evaluatedRoutes.push({
        coordinates: route.coordinates,
        alerts,
        riskyStreets,
        riskScore,
        highRiskCount,
        distance: route.distance,
        duration: route.duration,
      });
    }

    setEvaluatedRoutes(evaluatedRoutes);

    // Sélectionner l'itinéraire avec le score de risque le plus bas par défaut
    const safestRouteIndex = evaluatedRoutes.reduce((minIndex, route, index, arr) =>
      route.riskScore < arr[minIndex].riskScore ? index : minIndex, 0);

    console.log('Safest route index:', safestRouteIndex);
    console.log('Safest route riskScore:', evaluatedRoutes[safestRouteIndex].riskScore);

    let selectedRoute = evaluatedRoutes[safestRouteIndex];
    setSelectedRouteIndex(safestRouteIndex);

    console.log('Selected route alerts:', selectedRoute.alerts);
    setRiskAlerts(() => selectedRoute.alerts);

    setTimeout(() => {
      setRoute(selectedRoute.coordinates);
      setShowMainRoute(true);
    }, 2000);

    // Vérifier s'il y a des itinéraires alternatifs
    const alternativeRoutes = evaluatedRoutes.filter(route => route !== selectedRoute);
    if (alternativeRoutes.length > 0) {
      alternativeRoutes.sort((a, b) => a.riskScore - b.riskScore);
      let secondSafestRoute = alternativeRoutes[0]; // Prendre le plus sûr parmi les alternatifs

      console.log('Selected route riskScore:', selectedRoute.riskScore);
      console.log('Second safest route riskScore:', secondSafestRoute.riskScore);

      // Si l'itinéraire alternatif est plus sûr, échanger via l'état
      if (secondSafestRoute.riskScore < selectedRoute.riskScore) {
        console.warn('Warning: secondSafestRoute has a lower riskScore than selectedRoute. Swapping routes.');
        const temp = selectedRoute;
        selectedRoute = secondSafestRoute;
        secondSafestRoute = temp;
        setSelectedRouteIndex(evaluatedRoutes.findIndex(route => route === selectedRoute));
        setRiskAlerts(() => selectedRoute.alerts);
        setRoute(selectedRoute.coordinates);
      }

      setAlternativeRoute(secondSafestRoute.coordinates);
      setAlternativeMessage(
        `Itinéraire principal : ${secondSafestRoute.riskScore.toFixed(2)} score de risque, ${secondSafestRoute.highRiskCount} zone(s) très risquée(s).
        \nItinéraire alternatif : ${selectedRoute.riskScore.toFixed(2)} score de risque, ${selectedRoute.highRiskCount} zone(s) très risquée(s).`
      );
      console.log('Setting showAlternativePrompt to true');
      setShowAlternativePrompt(true);
    } else {
      setAlternativeMessage("Aucun itinéraire alternatif trouvé.");
      console.log('Setting showAlternativePrompt to false: No alternative routes');
      setShowAlternativePrompt(false);
    }

    setCheckingRisks(false);
  };

  // Fonction pour adopter l'itinéraire alternatif comme principal
  const handleAlternativeRoute = () => {
    // Vérification si au moins deux itinéraires existent
    if (evaluatedRoutes.length > 1) {
      // Mise à jour de l'index sélectionné
      setSelectedRouteIndex(1);
      // Affichage de l'itinéraire alternatif en bleu
      setRoute(evaluatedRoutes[1].coordinates);
      // Mise à jour des alertes avec celles de l'itinéraire alternatif
      setRiskAlerts(evaluatedRoutes[1].alerts);
      // Activation de l'affichage de l'itinéraire principal
      setShowMainRoute(true);
      // Masquage de l'ancien itinéraire principal
      setAlternativeRoute(null);
      // Message confirmant l'adoption de l'itinéraire alternatif
      setAlternativeMessage("Itinéraire alternatif adopté comme nouveau principal.");
      // Masquage de l'invite
      setShowAlternativePrompt(false);
    }
  };
  const handleDeleteAlert = (indexToDelete) => {
    setRiskAlerts(prevAlerts => prevAlerts.filter((_, index) => index !== indexToDelete));
    if (riskAlerts.length === 1) {
      setShowAlternativePrompt(false);
    }
  };

  const getRiskColor = (riskIndex) => {
    if (riskIndex >= 1) return '#ff4444'; // Rouge
    if (riskIndex >= 0.5) return '#ffbb33'; // Orange
    return '#ffeb3b'; // Jaune
  };

  // Fonction pour gérer le clic sur "Itinéraire 1"
  const handleSelectRoute1 = () => {
    if (evaluatedRoutes.length > 0) {
      setSelectedRouteIndex(0);
      setRoute(evaluatedRoutes[0].coordinates);
      setRiskAlerts(evaluatedRoutes[0].alerts);
      setShowMainRoute(true);
    }
  };

  // Fonction pour gérer le clic sur "Itinéraire 2"
  const handleSelectRoute2 = () => {
    if (evaluatedRoutes.length > 1) {
      setSelectedRouteIndex(1);
      setRoute(evaluatedRoutes[1].coordinates);
      setRiskAlerts(evaluatedRoutes[1].alerts);
      setShowMainRoute(true);
      setAlternativeRoute(null);
    }
  };

  const bounds = destination ? [userPosition, destination] : null;

  if (loading) {
    return <div style={styles.container}>Chargement des données...</div>;
  }

  console.log('État riskAlerts avant le rendu :', riskAlerts);

  return (
    <div style={styles.container}>
      <div style={styles.searchBar}>
        <input
          type="text"
          value={streetName}
          onChange={(e) => setStreetName(e.target.value)}
          placeholder="Entrez un nom de rue à New York"
          style={styles.input}
        />
        <button onClick={handleGeocode} style={styles.button}>
          Rechercher
        </button>
      </div>

      {/* Ajout des boutons pour choisir l'itinéraire */}
      {evaluatedRoutes.length > 0 && (
        <div style={styles.routeButtonsContainer}>
          <button
            onClick={handleSelectRoute1}
            style={{
              ...styles.routeButton,
              backgroundColor: selectedRouteIndex === 0 ? '#0078FF' : '#6c757d',
            }}
          >
            Itinéraire 1
          </button>
          {evaluatedRoutes.length > 1 && (
            <button
              onClick={handleSelectRoute2}
              style={{
                ...styles.routeButton,
                backgroundColor: selectedRouteIndex === 1 ? '#0078FF' : '#6c757d',
              }}
            >
              Itinéraire 2
            </button>
          )}
        </div>
      )}

      {checkingRisks && (
        <div style={styles.loadingContainer}>
          Vérification des zones à risque...
        </div>
      )}

      <div style={styles.contentWrapper}>
        <MapContainer center={userPosition} zoom={13} style={styles.map}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={userPosition}>
            <Popup>Position de l'utilisateur</Popup>
          </Marker>
          {destination && (
            <Marker position={destination}>
              <Popup>Point d'arrivée : {streetName}</Popup>
            </Marker>
          )}
          {showMainRoute && route.length > 0 && (
            <Polyline 
              positions={route} 
              color="#0078FF" 
              weight={4} 
              opacity={0.8} 
            />
          )}
          {alternativeRoute && (
            <Polyline 
              positions={alternativeRoute} 
              color="#28a745" 
              weight={4} 
              opacity={0.8} 
            />
          )}
          {bounds && <MapUpdater bounds={bounds} />}
        </MapContainer>

        {riskAlerts.length > 0 && (
          <div style={styles.alertContainer}>
            {riskAlerts.map((alert, index) => (
              <div key={index} style={{
                ...styles.alert,
                backgroundColor: getRiskColor(alert.riskIndex),
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ flexGrow: 1 }}>
                  <strong>{alert.message}</strong>
                  <progress value={alert.riskIndex} max="1"></progress>
                </div>
                <button onClick={() => handleDeleteAlert(index)} style={styles.deleteButton}>
                  <FaTimes size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAlternativePrompt && (
        <div style={styles.promptContainer}>
          <p>  Des zones à risque ont été détectées. Voulez-vous un itinéraire plus sûr ?</p>
          {alternativeMessage && <p style={{ color: '#ff4444' }}>{alternativeMessage}</p>}
          <button onClick={handleAlternativeRoute} style={styles.promptButton}>
            Oui, adopter l'itinéraire alternatif
          </button>
          <button
            onClick={() => setShowAlternativePrompt(false)}
            style={{ ...styles.promptButton, backgroundColor: '#6c757d' }}
          >
            Non, continuer
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    height: '700px',
    width: '1500px',
    flexDirection: 'column',
    backgroundColor: '#f0f2f5',
    fontFamily: 'Arial, sans-serif',
  },
  searchBar: {
    padding: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    gap: '10px',
    zIndex: 1000,
  },
  routeButtonsContainer: {
    padding: '10px 15px',
    backgroundColor: '#ffffff',
    display: 'flex',
    gap: '10px',
    zIndex: 1000,
  },
  routeButton: {
    padding: '8px 15px',
    fontSize: '14px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    position: 'relative',
  },
  input: {
    flex: 1,
    padding: '10px 15px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #dcdcdc',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#0078FF',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  map: {
    height: '600px',
    width: '1200px',
  },
  loadingContainer: {
    position: 'absolute',
    top: '80px',
    left: '20px',
    zIndex: 1000,
    backgroundColor: '#ffffff',
    padding: '10px',
    borderRadius: '5px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
  },
  alertContainer: {
    position: 'absolute',
    top: '0px',
    right: '20px',
    zIndex: 1000,
    maxWidth: '300px',
  },
  alert: {
    color: '#ffffff',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '5px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '5px',
  },
  promptContainer: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    backgroundColor: '#ffffff',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
    maxWidth: '500px',
    width: '100%',
    boxSizing: 'border-box',
  },
  promptButton: {
    padding: '6px 12px',
    margin: '5px 2px',
    backgroundColor: '#28a745',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default Path;