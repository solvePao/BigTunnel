/**
 * BigTunnel - Leaflet OpenStreetMap Integration
 * solvepao research
 */

export class MapController {
  constructor(mapContainerId, onLocationChange) {
    this.containerId = mapContainerId;
    this.onLocationChange = onLocationChange;
    this.map = null;
    this.startMarker = null;
    this.antipodeMarker = null;
    this.currentStart = { lat: 40.4168, lon: -3.7038 }; // Madrid default
    this.currentAntipode = { lat: -40.4168, lon: 176.2962 };

    this.activeFocus = 'start'; // 'start' or 'antipode'

    this.init();
  }

  init() {
    if (typeof L === 'undefined') {
      console.error("Leaflet is not loaded.");
      return;
    }

    // 1. Initialize Leaflet Map
    this.map = L.map(this.containerId, {
      center: [this.currentStart.lat, this.currentStart.lon],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
      zoomControl: false
    });

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Use standard OpenStreetMap tiles directly; no key or account is needed.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    // 3. Clean Geodetic Pin Icons
    this.startIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div class="geodetic-pin geodetic-pin-origin" title="Point A (Origin)">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <circle cx="12" cy="12" r="6"/>
          </svg>
          <span>A</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.antipodeIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div class="geodetic-pin geodetic-pin-terminal" title="Point B (Antipode)">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <polygon points="12 2 22 20 2 20"></polygon>
          </svg>
          <span>B</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // 4. Create Draggable Start Marker
    this.startMarker = L.marker([this.currentStart.lat, this.currentStart.lon], {
      icon: this.startIcon,
      draggable: true,
      title: "Departure Point (Drag or click anywhere to reposition)"
    }).addTo(this.map);

    this.startMarker.bindPopup("<b>Point A: Departure Point</b><br>Drag to reposition or click anywhere on the map.");

    // Drag events
    let dragThrottle = null;
    this.startMarker.on('drag', (e) => {
      const pos = e.target.getLatLng();
      if (!dragThrottle) {
        dragThrottle = setTimeout(() => {
          this.handleCoordinateUpdate(pos.lat, pos.lng);
          dragThrottle = null;
        }, 30);
      }
    });

    this.startMarker.on('dragend', (e) => {
      if (dragThrottle) {
        clearTimeout(dragThrottle);
        dragThrottle = null;
      }
      const pos = e.target.getLatLng();
      this.handleCoordinateUpdate(pos.lat, pos.lng);
    });

    // 5. Create Antipode Marker
    this.antipodeMarker = L.marker([this.currentAntipode.lat, this.currentAntipode.lon], {
      icon: this.antipodeIcon,
      title: "Point B: What Lies on the Other End"
    }).addTo(this.map);

    this.antipodeMarker.bindPopup("<b>Point B: The Antipode</b><br>What lies at the other end of the tunnel!");

    // 6. Map click event to set departure point
    this.map.on('click', (e) => {
      this.handleCoordinateUpdate(e.latlng.lat, e.latlng.lng);
    });

    // 7. Invalidate size after layout completes
    setTimeout(() => {
      this.map.invalidateSize();
    }, 400);
  }

  handleCoordinateUpdate(lat, lon) {
    let normalizedLon = lon;
    while (normalizedLon > 180) normalizedLon -= 360;
    while (normalizedLon < -180) normalizedLon += 360;

    const clampedLat = Math.max(-89.9, Math.min(89.9, lat));

    if (this.onLocationChange) {
      this.onLocationChange(clampedLat, normalizedLon);
    }
  }

  updateMarkers(startLat, startLon, antiLat, antiLon, shouldFly = false) {
    this.currentStart = { lat: startLat, lon: startLon };
    this.currentAntipode = { lat: antiLat, lon: antiLon };

    const osmUrl = `https://www.openstreetmap.org/?mlat=${antiLat}&mlon=${antiLon}#map=8/${antiLat}/${antiLon}`;

    if (this.startMarker) {
      this.startMarker.setLatLng([startLat, startLon]);
      this.startMarker.setPopupContent(`
        <div class="map-popup-card">
          <div class="map-popup-title">Point A · Origin</div>
          <div class="map-popup-coords">${startLat.toFixed(4)}°, ${startLon.toFixed(4)}°</div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:0.2rem;">Drag or click anywhere to reposition</div>
        </div>
      `);
    }

    if (this.antipodeMarker) {
      this.antipodeMarker.setLatLng([antiLat, antiLon]);
      this.antipodeMarker.setPopupContent(`
        <div class="map-popup-card">
          <div class="map-popup-title">Point B · The Antipode</div>
          <div class="map-popup-coords">${antiLat.toFixed(4)}°, ${antiLon.toFixed(4)}°</div>
          <div class="map-popup-actions">
            <a href="${osmUrl}" target="_blank" rel="noopener noreferrer" class="map-popup-link popup-osm">Open in OpenStreetMap ↗</a>
          </div>
        </div>
      `);
    }

    if (shouldFly) {
      this.flyToTarget(this.activeFocus);
    }
  }

  flyToTarget(focus = 'start') {
    this.activeFocus = focus;
    if (!this.map) return;
    // Leaflet cannot animate a flight in a hidden, zero-sized panel.
    if (!this.map.getContainer().clientWidth || !this.map.getContainer().clientHeight) {
      const target = focus === 'start' ? this.currentStart : this.currentAntipode;
      this.map.setView([target.lat, target.lon], Math.max(this.map.getZoom(), 4), { animate: false });
      return;
    }

    this.map.stop();
    this.map.invalidateSize({ animate: false });
    if (focus === 'start') {
      this.map.flyTo([this.currentStart.lat, this.currentStart.lon], Math.max(this.map.getZoom(), 4), {
        duration: 1.2
      });
      if (this.startMarker) this.startMarker.openPopup();
    } else {
      this.map.flyTo([this.currentAntipode.lat, this.currentAntipode.lon], Math.max(this.map.getZoom(), 4), {
        duration: 1.2
      });
      if (this.antipodeMarker) this.antipodeMarker.openPopup();
    }
  }

  /**
   * Browser Geolocation request with user prompt & clear error handling
   */
  requestUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this.handleCoordinateUpdate(lat, lon);
          this.flyToTarget('start');
          resolve({ lat, lon, accuracy: position.coords.accuracy });
        },
        (error) => {
          let msg = "Could not obtain location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              msg = "Location permission was denied. You can still pick any place on the map!";
              break;
            case error.POSITION_UNAVAILABLE:
              msg = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              msg = "Location request timed out.";
              break;
          }
          reject(new Error(msg));
        },
        options
      );
    });
  }

  /**
   * Search place name using OpenStreetMap Nominatim
   */
  async searchPlace(query) {
    if (!query || query.trim().length < 2) return [];

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error("Search service failed");
    return await response.json();
  }

  invalidateSize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }
}
