document.addEventListener('DOMContentLoaded', () => {
    const mapDiv = document.getElementById('map');
    const generateBtn = document.getElementById('generateBtn');
    const radiusInput = document.getElementById('radius');
    const statusText = document.getElementById('status');
    const resultsLat = document.getElementById('results-lat');
    const resultsLng = document.getElementById('results-lng');

    let map = null;
    let userMarker = null;
    let pointMarker = null;
    let searchCircle = null;

    // --- 1. GEOLOCATION AND MAP INITIALIZATION ---

    function updateStatus(message, type = 'default') {
        statusText.textContent = message;
        statusText.className = '';
        if (type === 'loading') {
            statusText.classList.add('status-loading');
        } else if (type === 'error') {
            statusText.classList.add('status-error');
        }
    }
    
    function updateResultsDisplay(lat, lng) {
        resultsLat.textContent = `Lat: ${lat.toFixed(6)}`;
        resultsLng.textContent = `Lng: ${lng.toFixed(6)}`;
    }

    function initMap(lat, lng) {
        if (map) return; 

        map = L.map(mapDiv).setView([lat, lng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        userMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            })
        }).addTo(map).bindPopup("Your Location").openPopup();
        
        // Automatically generate the first point
        handleGenerate(); 
    }

    function getLocation() {
        updateStatus('Finding your location...', 'loading');
        generateBtn.disabled = true;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    initMap(lat, lng);
                    updateStatus('Location found. First point generated!');
                    generateBtn.disabled = false;
                },
                (error) => {
                    updateStatus(`Error: Geolocation failed (${error.code}). Please enable location services.`, 'error');
                    console.error("Geolocation Error:", error);
                }
            );
        } else {
            updateStatus("Geolocation is not supported by this browser.", 'error');
        }
    }

    // --- 2. COORDINATE GENERATION LOGIC ---

    /**
     * Generates a random coordinate within a given radius (in meters) of a central point.
     */
    function getRandomPointInRadius(centerLat, centerLng, radius) {
        const R = 6378137; // Earth's radius in meters
        
        const angle = Math.random() * 2 * Math.PI;

        // Use sqrt(rand) for uniform area distribution
        const distance = Math.sqrt(Math.random()) * radius; 

        // Calculate delta latitude (approximate)
        const dLat = (distance / R) * Math.cos(angle);
        
        // Calculate delta longitude (approximate, adjusted for latitude)
        const dLng = (distance / (R * Math.cos(Math.PI * centerLat / 180))) * Math.sin(angle);

        const newLat = centerLat + (dLat * 180 / Math.PI);
        const newLng = centerLng + (dLng * 180 / Math.PI);

        return { lat: newLat, lng: newLng };
    }

    // --- 3. EVENT HANDLER ---

    function handleGenerate() {
        if (!map || !userMarker) {
            updateStatus('Map not initialized. Please wait for location.', 'error');
            return;
        }

        const centerLat = userMarker.getLatLng().lat;
        const centerLng = userMarker.getLatLng().lng;
        const radius = parseFloat(radiusInput.value);

        if (isNaN(radius) || radius < 100 || radius > 10000) {
            updateStatus('Please enter a valid radius (100m to 10000m).', 'error');
            return;
        }

        updateStatus('Generating random point...', 'loading');
        
        // A. Generate Point
        const randomPoint = getRandomPointInRadius(centerLat, centerLng, radius);

        // B. Update Radius Circle
        if (searchCircle) {
            map.removeLayer(searchCircle);
        }
        searchCircle = L.circle([centerLat, centerLng], {
            radius: radius,
            color: '#FFC107', /* Yellow border */
            fillColor: '#FFC107',
            fillOpacity: 0.15,
            weight: 2
        }).addTo(map);

        // C. Update Point Marker (Use a Red marker for the destination)
        if (pointMarker) {
            map.removeLayer(pointMarker);
        }

        pointMarker = L.marker([randomPoint.lat, randomPoint.lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            })
        }).addTo(map)
          .bindPopup(`**Random Target**<br>Lat: ${randomPoint.lat.toFixed(6)}<br>Lng: ${randomPoint.lng.toFixed(6)}`)
          .openPopup();

        // D. Update UI and Map View
        updateResultsDisplay(randomPoint.lat, randomPoint.lng);
        map.fitBounds(searchCircle.getBounds(), { padding: [50, 50] });

        updateStatus(`Point generated at ${radius} meters. Ready for exploration!`);
    }

    // Initial setup listeners
    generateBtn.addEventListener('click', handleGenerate);
    // Re-run generation if the radius changes
    radiusInput.addEventListener('change', handleGenerate); 
    
    // Start geolocation process
    getLocation();
});
