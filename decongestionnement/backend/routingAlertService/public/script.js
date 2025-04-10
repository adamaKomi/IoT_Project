document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const alertsList = document.getElementById('alertsList');
    const routeForm = document.getElementById('routeForm');
    const startPointInput = document.getElementById('startPoint');
    const destinationInput = document.getElementById('destination');
    const originalRouteDetails = document.getElementById('originalRouteDetails');
    const alternativeRouteDetails = document.getElementById('alternativeRouteDetails');
    const tabButtons = document.querySelectorAll('.tab-btn');

    // Exemple de coordonnées pour faciliter les tests
    startPointInput.value = "33.689, -7.384";
    destinationInput.value = "33.692, -7.381";

    // Socket.io pour les mises à jour en temps réel
    const socket = io(window.location.origin);
    
    socket.on('connect', () => {
        console.log('Connecté au serveur WebSocket');
    });
    
    socket.on('welcome', (data) => {
        console.log(data.message);
    });
    
    socket.on('congestion_update', (data) => {
        console.log('Mise à jour des alertes de congestion reçue');
        fetchAlerts(); // Actualiser les alertes
    });

    // Changer d'onglet
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.route-tab-content').forEach(tab => tab.classList.remove('active'));
            
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Récupérer les alertes de congestion
    async function fetchAlerts() {
        try {
            const response = await fetch('/api/alerts/congestion');
            const alerts = await response.json();
            
            if (alerts.length === 0) {
                alertsList.innerHTML = '<p class="no-alerts">Aucune alerte de congestion actuellement.</p>';
                return;
            }
            
            displayAlerts(alerts);
        } catch (error) {
            console.error('Erreur lors de la récupération des alertes:', error);
            alertsList.innerHTML = '<p class="error">Impossible de charger les alertes. Veuillez réessayer.</p>';
        }
    }

    // Afficher les alertes dans l'interface
    function displayAlerts(alerts) {
        alertsList.innerHTML = '';
        
        alerts.forEach(alert => {
            const alertCard = document.createElement('div');
            alertCard.className = `alert-card ${alert.congestionLevel}`;
            
            const timestamp = new Date(alert.timestamp);
            const formattedTime = timestamp.toLocaleTimeString();
            
            alertCard.innerHTML = `
                <h3>${formatLaneId(alert.lane_id)}</h3>
                <p>${alert.message}</p>
                <span class="alert-time">Détecté à ${formattedTime}</span>
            `;
            
            alertsList.appendChild(alertCard);
        });
    }

    // Formater les identifiants de voie pour les rendre plus lisibles
    function formatLaneId(laneId) {
        // Remplacer les caractères techniques par des noms plus compréhensibles
        return laneId
            .replace(/_0$/, '')  // Enlever le suffixe _0
            .replace(/^-/, '')   // Enlever le préfixe -
            .replace(/\d+#\d+/, 'Section $&'); // Ajouter "Section" pour les identifiants avec #
    }

    // Gérer la soumission du formulaire d'itinéraire
    routeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const startCoords = parseCoordinates(startPointInput.value);
        const destCoords = parseCoordinates(destinationInput.value);
        
        if (!startCoords || !destCoords) {
            alert('Format de coordonnées invalide. Utilisez le format: latitude, longitude');
            return;
        }
        
        try {
            // Récupérer l'itinéraire original
            const originalRes = await fetch('/api/routing/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: startCoords,
                    end: destCoords
                })
            });
            
            const originalRoute = await originalRes.json();
            displayRoute(originalRoute, originalRouteDetails, true);
            
            // Récupérer les itinéraires alternatifs
            const altRes = await fetch('/api/routing/alternatives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: startCoords,
                    end: destCoords
                })
            });
            
            const alternativeRoute = await altRes.json();
            displayRoute(alternativeRoute, alternativeRouteDetails, false);
            
        } catch (error) {
            console.error('Erreur lors de la récupération des itinéraires:', error);
            originalRouteDetails.innerHTML = `<p class="error">Erreur lors du calcul d'itinéraire: ${error.message}</p>`;
        }
    });

    // Convertir une chaîne de coordonnées en objet {lat, lng}
    function parseCoordinates(coordStr) {
        const parts = coordStr.split(',').map(part => parseFloat(part.trim()));
        if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
            return null;
        }
        return { lat: parts[0], lng: parts[1] };
    }

    // Afficher un itinéraire
    function displayRoute(routeData, container, isOriginal) {
        if (!routeData || !routeData.route) {
            container.innerHTML = '<p class="no-route">Itinéraire non disponible.</p>';
            return;
        }
        
        let html = '';
        
        // Afficher chaque segment de l'itinéraire
        routeData.route.segments.forEach((segment, index) => {
            const hasCongestion = segment.congestionLevel && segment.congestionLevel !== 'green';
            const statusClass = hasCongestion ? 'congestion' : 'ok';
            const statusText = hasCongestion ? 'Congestion' : 'Fluide';
            
            html += `
                <div class="route-segment">
                    <div class="segment-header">
                        <strong>Segment ${index + 1}: ${segment.name || formatLaneId(segment.lane_id)}</strong>
                        <span class="segment-status ${statusClass}">${statusText}</span>
                    </div>
                    <p>${segment.instruction || 'Suivez cette route'}</p>
                    ${hasCongestion ? `<p class="congestion-warning">Attention: ${segment.congestionMessage || 'Trafic ralenti sur ce segment'}</p>` : ''}
                </div>
            `;
        });
        
        // Ajouter le résumé de l'itinéraire
        html += `
            <div class="route-summary">
                <div class="route-summary-item">
                    <span class="route-summary-value">${routeData.route.distance.toFixed(1)} km</span>
                    <span class="route-summary-label">Distance</span>
                </div>
                <div class="route-summary-item">
                    <span class="route-summary-value">${Math.round(routeData.route.duration)} min</span>
                    <span class="route-summary-label">Durée</span>
                </div>
                <div class="route-summary-item">
                    <span class="route-summary-value">${routeData.route.congestionLevel || 'Normal'}</span>
                    <span class="route-summary-label">Niveau de trafic</span>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Si c'est un itinéraire alternatif et qu'il est meilleur, mettre en évidence
        if (!isOriginal && routeData.isBetterThanOriginal) {
            container.innerHTML = `
                <div class="better-route-notice">
                    <i class="fas fa-check-circle"></i> Cet itinéraire permet d'éviter les congestions
                </div>
            ` + container.innerHTML;
        }
    }

    // Charger les alertes immédiatement au chargement de la page
    fetchAlerts();
    
    // Actualiser les alertes toutes les 30 secondes
    setInterval(fetchAlerts, 30000);
});
