/**
 * BigTunnel - Main Application Controller
 * solvepao research
 */

import {
  calculateAntipode,
  formatDMS,
  formatPrettyDecimal,
  calculateTunnelLength,
  calculateSurfaceDistance,
  calculateTunnelTransitPhysics,
  reverseGeocode,
  getOpenStreetMapUrl,
  EARTH_RADIUS_KM,
  EARTH_DIAMETER_KM
} from './antipode.js';

import { FAMOUS_ANTIPODES, EARTH_GEOLOGY_LAYERS } from './data.js';
import { Globe3D } from './globe3d.js';
import { MapController } from './map.js';

class BigTunnelApp {
  constructor() {
    // Initial default state: Madrid, Spain
    this.startLat = 40.4168;
    this.startLon = -3.7038;
    this.antiLat = -40.4168;
    this.antiLon = 176.2962;

    this.globe = null;
    this.mapCtrl = null;
    this.isDrilling = false;
    this.drillAnimationTimer = null;
    this.currentDrillDepthKm = 0;

    this.init();
  }

  async init() {
    this.setupFooterYear();
    this.initGlobe();
    this.initMap();
    this.setupEventListeners();
    this.renderFamousAntipodes();
    this.renderGeologyLayers();

    // Initial calculation & UI update
    await this.updateCoordinates(this.startLat, this.startLon, true);
  }

  setupFooterYear() {
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  initGlobe() {
    const globeContainer = document.getElementById('globe-canvas-container');
    if (globeContainer && typeof THREE !== 'undefined') {
      try {
        this.globe = new Globe3D(globeContainer);
      } catch (err) {
        console.error("Three.js Globe initialization failed:", err);
      }
    }
  }

  initMap() {
    const mapContainer = document.getElementById('osm-map');
    if (mapContainer && typeof L !== 'undefined') {
      try {
        this.mapCtrl = new MapController('osm-map', (lat, lon) => {
          this.updateCoordinates(lat, lon, false);
        });
      } catch (err) {
        console.error("Leaflet Map initialization failed:", err);
      }
    }
  }

  setupEventListeners() {
    // 1. Geolocation Request Button
    const locateBtn = document.getElementById('btn-locate-me');
    if (locateBtn) {
      locateBtn.addEventListener('click', () => this.handleLocateMe());
    }

    // Location entry is available in every view, including without WebGL.
    document.getElementById('coordinate-form').addEventListener('submit', (event) => {
      event.preventDefault();
      this.updateCoordinates(Number(document.getElementById('latitude-input').value),
        Number(document.getElementById('longitude-input').value), true);
      this.showToast('Antipode calculated. Explore your result below.');
    });
    const examples = document.getElementById('example-select');
    FAMOUS_ANTIPODES.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.departure.name;
      examples.appendChild(option);
    });
    examples.addEventListener('change', () => {
      const item = FAMOUS_ANTIPODES.find(item => item.id === examples.value);
      if (item) this.updateCoordinates(item.departure.lat, item.departure.lon, true);
    });

    const searchInput = document.getElementById('location-search-input');
    const searchResults = document.getElementById('search-results-dropdown');
    const searchStatus = document.getElementById('search-status');
    let debounceTimer;
    let searchVersion = 0;
    const closeResults = () => {
      searchResults.classList.add('hidden');
      searchInput.setAttribute('aria-expanded', 'false');
    };
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const version = ++searchVersion;
      const query = searchInput.value.trim();
      closeResults();
      if (query.length < 2) {
        searchStatus.textContent = 'Or enter decimal coordinates below.';
        return;
      }
      searchStatus.textContent = 'Searching…';
      debounceTimer = setTimeout(async () => {
        try {
          const results = await this.mapCtrl.searchPlace(query);
          if (version !== searchVersion) return;
          this.renderSearchResults(results, searchResults, searchInput);
          searchStatus.textContent = results.length ? 'Select a place below.' : 'No places found. Try another name or use coordinates.';
        } catch {
          if (version === searchVersion) searchStatus.textContent = 'Place search unavailable. You can enter coordinates or try an example.';
        }
      }, 450);
    });
    searchInput.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        ++searchVersion;
        clearTimeout(debounceTimer);
        closeResults();
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        searchResults.querySelector('button')?.focus();
      }
    });
    searchResults.addEventListener('keydown', event => {
      const buttons = [...searchResults.querySelectorAll('button')];
      const index = buttons.indexOf(document.activeElement);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        buttons[(index + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length]?.focus();
      }
      if (event.key === 'Escape') { closeResults(); searchInput.focus(); }
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.search-box-container')) {
        ++searchVersion;
        clearTimeout(debounceTimer);
        closeResults();
      }
    });

    // 3. Map View Switchers (Center Start vs Center Antipode)
    const flyStartBtn = document.getElementById('btn-map-fly-start');
    if (flyStartBtn) {
      flyStartBtn.addEventListener('click', () => {
        this.setActiveMapTarget('start');
        if (this.mapCtrl) this.mapCtrl.flyToTarget('start');
      });
    }

    const flyAntiBtn = document.getElementById('btn-map-fly-anti');
    if (flyAntiBtn) {
      flyAntiBtn.addEventListener('click', () => {
        this.setActiveMapTarget('antipode');
        if (this.mapCtrl) this.mapCtrl.flyToTarget('antipode');
      });
    }

    // 4. 3D Globe Controls
    const viewCrossSectionBtn = document.getElementById('btn-globe-cross');
    if (viewCrossSectionBtn && this.globe) {
      viewCrossSectionBtn.addEventListener('click', () => this.globe.setCameraView('cross-section'));
    }

    const viewStartBtn = document.getElementById('btn-globe-start');
    if (viewStartBtn && this.globe) {
      viewStartBtn.addEventListener('click', () => this.globe.setCameraView('start'));
    }

    const viewAntiBtn = document.getElementById('btn-globe-anti');
    if (viewAntiBtn && this.globe) {
      viewAntiBtn.addEventListener('click', () => this.globe.setCameraView('antipode'));
    }

    const viewCoreBtn = document.getElementById('btn-globe-core');
    if (viewCoreBtn && this.globe) {
      viewCoreBtn.addEventListener('click', () => this.globe.setCameraView('core'));
    }

    const toggleRotateBtn = document.getElementById('btn-globe-rotate');
    if (toggleRotateBtn && this.globe) {
      toggleRotateBtn.addEventListener('click', (e) => {
        const isSpinning = this.globe.toggleAutoRotate();
        toggleRotateBtn.classList.toggle('active', isSpinning);
        toggleRotateBtn.setAttribute('aria-pressed', String(isSpinning));
      });
    }

    const toggleXRayBtn = document.getElementById('btn-globe-xray');
    if (toggleXRayBtn && this.globe) {
      toggleXRayBtn.addEventListener('click', (e) => {
        const isXRay = this.globe.toggleXRay();
        toggleXRayBtn.classList.toggle('active', isXRay);
        toggleXRayBtn.setAttribute('aria-pressed', String(isXRay));
      });
    }

    // 5. Copy Coordinates Button
    const copyBtn = document.getElementById('btn-copy-antipode');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = `${this.antiLat}, ${this.antiLon} (${formatDMS(this.antiLat, this.antiLon)})`;
        navigator.clipboard.writeText(text).then(() => {
          this.showToast("Antipode coordinates copied to clipboard!");
        }).catch(() => this.showToast("Could not copy. Select the coordinates above to copy them.", "warning"));
      });
    }

    // 6. Drill Simulator Slider & Play Button
    const drillSlider = document.getElementById('drill-depth-slider');
    if (drillSlider) {
      drillSlider.addEventListener('input', (e) => {
        clearInterval(this.drillAnimationTimer);
        this.isDrilling = false;
        document.getElementById('btn-play-drill').textContent = 'Run simulation';
        const depth = parseFloat(e.target.value);
        this.updateDrillPhysics(depth);
      });
    }

    const playDrillBtn = document.getElementById('btn-play-drill');
    if (playDrillBtn) {
      playDrillBtn.addEventListener('click', () => this.toggleDrillSimulation());
    }

    // 7. Tab Switching on Mobile/Desktop
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;
        this.switchMainView(targetView);
      });
    });
  }

  setActiveMapTarget(type) {
    const btnStart = document.getElementById('btn-map-fly-start');
    const btnAnti = document.getElementById('btn-map-fly-anti');
    if (type === 'start') {
      btnStart?.classList.add('active');
      btnAnti?.classList.remove('active');
    } else {
      btnAnti?.classList.add('active');
      btnStart?.classList.remove('active');
    }
  }

  switchMainView(viewName) {
    this.mapCtrl?.map?.stop();
    document.querySelectorAll('.nav-tab-btn').forEach(button => {
      const active = button.dataset.view === viewName;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const panelMap = document.getElementById('panel-map-view');
    const panelGlobe = document.getElementById('panel-globe-view');
    const panelDrill = document.getElementById('panel-drill-view');
    const panelResearch = document.getElementById('panel-research-view');

    const panels = [panelMap, panelGlobe, panelDrill, panelResearch];
    panels.forEach(p => {
      if (p) p.classList.add('view-panel-hidden');
    });

    if (viewName === 'globe' && panelGlobe) {
      panelGlobe.classList.remove('view-panel-hidden');
      setTimeout(() => {
        if (this.globe) this.globe.onWindowResize();
      }, 70);
    } else if (viewName === 'map' && panelMap) {
      panelMap.classList.remove('view-panel-hidden');
      setTimeout(() => {
        if (this.mapCtrl) this.mapCtrl.invalidateSize();
      }, 70);
    } else if (viewName === 'drill' && panelDrill) {
      panelDrill.classList.remove('view-panel-hidden');
    } else if (viewName === 'research' && panelResearch) {
      panelResearch.classList.remove('view-panel-hidden');
    }
  }

  async handleLocateMe() {
    const locateBtn = document.getElementById('btn-locate-me');
    const statusText = document.getElementById('location-status');

    if (locateBtn) locateBtn.disabled = true;
    if (statusText) statusText.textContent = "Requesting satellite GPS coordinates...";

    try {
      if (!this.mapCtrl) throw new Error('Location is unavailable. Please enter coordinates instead.');
      const pos = await this.mapCtrl.requestUserLocation();
      if (statusText) statusText.textContent = `Located (Accuracy ±${Math.round(pos.accuracy)}m)`;
      this.showToast("Your current location found!");
    } catch (err) {
      if (statusText) statusText.textContent = err.message;
      this.showToast(err.message, 'warning');
    } finally {
      if (locateBtn) locateBtn.disabled = false;
    }
  }

  renderSearchResults(results, container, inputEl) {
    container.innerHTML = '';
    if (!results || results.length === 0) {
      container.classList.add('hidden');
      return;
    }

    results.forEach(item => {
      const div = document.createElement('button');
      div.type = 'button';
      div.className = 'search-result-item';
      const name = document.createElement('div');
      name.className = 'result-name';
      name.textContent = item.display_name;
      const type = document.createElement('div');
      type.className = 'result-type';
      type.textContent = `${item.type || 'place'} · ${Number(item.lat).toFixed(2)}°, ${Number(item.lon).toFixed(2)}°`;
      div.append(name, type);
      div.addEventListener('click', () => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        inputEl.value = item.display_name.split(',')[0];
        container.classList.add('hidden');
        inputEl.setAttribute('aria-expanded', 'false');
        document.getElementById('search-status').textContent = 'Place selected. Your coordinates are updated.';
        inputEl.focus();
        this.updateCoordinates(lat, lon, true);
        if (this.mapCtrl) this.mapCtrl.flyToTarget('start');
      });
      container.appendChild(div);
    });

    container.classList.remove('hidden');
    inputEl.setAttribute('aria-expanded', 'true');
  }

  async updateCoordinates(lat, lon, shouldFlyMap = false) {
    const result = calculateAntipode(lat, lon);
    clearInterval(this.drillAnimationTimer);
    this.isDrilling = false;
    document.getElementById('btn-play-drill').textContent = 'Run simulation';
    this.startLat = result.start.lat;
    this.startLon = result.start.lon;
    this.antiLat = result.antipode.lat;
    this.antiLon = result.antipode.lon;

    document.getElementById('latitude-input').value = this.startLat;
    document.getElementById('longitude-input').value = this.startLon;
    document.getElementById('example-select').value = FAMOUS_ANTIPODES.find(item =>
      item.departure.lat === this.startLat && item.departure.lon === this.startLon)?.id || '';

    // 1. Update 3D Globe
    if (this.globe) {
      this.globe.updateLocations(this.startLat, this.startLon, this.antiLat, this.antiLon);
    }

    // 2. Update Map Markers
    if (this.mapCtrl) {
      this.mapCtrl.updateMarkers(this.startLat, this.startLon, this.antiLat, this.antiLon, shouldFlyMap);
    }

    // 3. Update Text Metrics
    this.renderCoordinateMetrics();

    // 4. Update the OpenStreetMap link
    this.updateActionLinks();

    // 5. Update Drill Simulator max depth and reset
    this.currentDrillDepthKm = 0;
    const drillSlider = document.getElementById('drill-depth-slider');
    if (drillSlider) drillSlider.value = 0;
    this.updateDrillPhysics(0);

    // 6. Reverse Geocode in background
    this.fetchReverseGeocodeData();
  }

  renderCoordinateMetrics() {
    // Departure Metrics
    const depDec = document.getElementById('dep-coords-dec');
    const depDms = document.getElementById('dep-coords-dms');
    if (depDec) depDec.textContent = formatPrettyDecimal(this.startLat, this.startLon);
    if (depDms) depDms.textContent = formatDMS(this.startLat, this.startLon);

    // Antipode Metrics
    const antiDec = document.getElementById('anti-coords-dec');
    const antiDms = document.getElementById('anti-coords-dms');
    if (antiDec) antiDec.textContent = formatPrettyDecimal(this.antiLat, this.antiLon);
    if (antiDms) antiDms.textContent = formatDMS(this.antiLat, this.antiLon);

    // Distances
    const tunnelDistKm = calculateTunnelLength(this.startLat, this.startLon, this.antiLat, this.antiLon);
    const surfaceDistKm = calculateSurfaceDistance(this.startLat, this.startLon, this.antiLat, this.antiLon);

    const tunnelDistEl = document.getElementById('metric-tunnel-dist');
    const surfaceDistEl = document.getElementById('metric-surface-dist');

    if (tunnelDistEl) {
      tunnelDistEl.textContent = `${Math.round(tunnelDistKm).toLocaleString()} km`;
    }
    if (surfaceDistEl) {
      surfaceDistEl.textContent = `${Math.round(surfaceDistKm).toLocaleString()} km`;
    }

    // Transit Physics Metrics
    const physics = calculateTunnelTransitPhysics();
    const transitTimeEl = document.getElementById('metric-transit-time');
    const maxSpeedEl = document.getElementById('metric-max-speed');

    if (transitTimeEl) transitTimeEl.textContent = `${physics.premTimeFormatted} (PREM Model)`;
    if (maxSpeedEl) maxSpeedEl.textContent = `${physics.maxVelocityPremKmh.toLocaleString()} km/h (Core Speed)`;
  }

  updateActionLinks() {
    const mapLink = document.getElementById('btn-view-antipode-map');
    if (mapLink) mapLink.href = getOpenStreetMapUrl(this.antiLat, this.antiLon);
  }

  async fetchReverseGeocodeData() {
    const antipodePlaceEl = document.getElementById('antipode-location-name');
    const antipodeTypeEl = document.getElementById('antipode-type-badge');
    const antipodeDetailsEl = document.getElementById('antipode-details-text');
    const departurePlaceEl = document.getElementById('departure-location-name');

    if (antipodePlaceEl) antipodePlaceEl.textContent = "Locating…";
    if (antipodeTypeEl) {
      antipodeTypeEl.textContent = "Locating…";
      antipodeTypeEl.className = "status-badge status-loading";
    }

    const requestVersion = (this.geocodeVersion || 0) + 1;
    this.geocodeVersion = requestVersion;
    if (departurePlaceEl) departurePlaceEl.textContent = 'Locating…';
    if (antipodeDetailsEl) antipodeDetailsEl.textContent = 'Looking up the surface at these coordinates.';

    // 1. Fetch Departure Place
    reverseGeocode(this.startLat, this.startLon).then(depData => {
      if (requestVersion !== this.geocodeVersion) return;
      if (departurePlaceEl) {
        departurePlaceEl.textContent = (depData.raw ? depData.displayName : '') || `${this.startLat.toFixed(2)}°, ${this.startLon.toFixed(2)}°`;
      }
    });

    // 2. Fetch Antipode Place
    const antiData = await reverseGeocode(this.antiLat, this.antiLon);
    if (requestVersion !== this.geocodeVersion) return;

    if (!antiData.raw) {
      if (antipodePlaceEl) antipodePlaceEl.textContent = 'Surface lookup unavailable';
      if (antipodeTypeEl) {
        antipodeTypeEl.textContent = 'Unverified';
        antipodeTypeEl.className = 'status-badge';
      }
      if (antipodeDetailsEl) antipodeDetailsEl.textContent = 'The antipodal coordinates are calculated locally. The place service could not verify this surface location; open a map to explore it.';
      return;
    }
    if (antipodePlaceEl) {
      antipodePlaceEl.textContent = antiData.displayName;
    }

    if (antipodeTypeEl) {
      if (antiData.isLand) {
        antipodeTypeEl.textContent = "Land";
        antipodeTypeEl.className = "status-badge status-land";
      } else {
        antipodeTypeEl.textContent = "Ocean";
        antipodeTypeEl.className = "status-badge status-ocean";
      }
    }

    if (antipodeDetailsEl) {
      if (antiData.isLand) {
        antipodeDetailsEl.textContent = `A tunnel here punches through into solid ground in ${antiData.country}${antiData.state ? ', ' + antiData.state : ''}. Only ~4.4% of land on Earth has land on the other side!`;
      } else {
        antipodeDetailsEl.textContent = `A tunnel dug here breaches right into the waters of the ${antiData.waterBody}. You would emerge underwater under the open sky!`;
      }
    }
  }

  updateDrillPhysics(depthKm) {
    this.currentDrillDepthKm = depthKm;
    const totalDepthKm = EARTH_DIAMETER_KM; // ~12,742 km
    const ratio = depthKm / totalDepthKm;

    // Update 3D Drill Capsule position in globe
    if (this.globe) {
      this.globe.setDrillPositionRatio(ratio);
    }

    // Calculate distance from center (0 to 6,371 km)
    const distFromStartKm = depthKm;
    let distFromCenterKm;
    if (distFromStartKm <= EARTH_RADIUS_KM) {
      distFromCenterKm = EARTH_RADIUS_KM - distFromStartKm;
    } else {
      distFromCenterKm = distFromStartKm - EARTH_RADIUS_KM;
    }

    const currentDepthFromSurface = EARTH_RADIUS_KM - distFromCenterKm;

    // Determine current layer
    let currentLayer = EARTH_GEOLOGY_LAYERS[0];
    for (const layer of EARTH_GEOLOGY_LAYERS) {
      if (currentDepthFromSurface >= layer.depthStartKm && currentDepthFromSurface <= layer.depthEndKm) {
        currentLayer = layer;
        break;
      }
    }

    // Physics calculations
    // Velocity in gravity train (harmonic approximation): v = sqrt(g/R * (R^2 - r^2))
    const r = distFromCenterKm * 1000;
    const R = EARTH_RADIUS_KM * 1000;
    const g = 9.80665;
    const velocityMs = Math.sqrt(Math.max(0, (g / R) * (R * R - r * r)));
    const velocityKmh = Math.round(velocityMs * 3.6);

    // Gravity: linear approximation inside uniform Earth g(r) = g0 * (r / R)
    const localGravity = (g * (distFromCenterKm / EARTH_RADIUS_KM)).toFixed(2);

    // Core temperature gradient: Ambient ~20°C up to ~5700°C at center
    const tempRatio = 1 - (distFromCenterKm / EARTH_RADIUS_KM);
    const estimatedTemp = Math.round(20 + Math.pow(tempRatio, 0.75) * 5680);

    // Core pressure gradient: 1 atm to 364 GPa
    const estimatedPressure = (Math.pow(tempRatio, 1.4) * 364).toFixed(1);

    // Update UI elements
    const depthReadout = document.getElementById('drill-depth-readout');
    const layerNameReadout = document.getElementById('drill-layer-name');
    const layerDescReadout = document.getElementById('drill-layer-desc');
    const speedReadout = document.getElementById('drill-speed-readout');
    const gravityReadout = document.getElementById('drill-gravity-readout');
    const tempReadout = document.getElementById('drill-temp-readout');
    const pressureReadout = document.getElementById('drill-pressure-readout');

    if (depthReadout) depthReadout.textContent = `${Math.round(depthKm).toLocaleString()} km / ${Math.round(totalDepthKm).toLocaleString()} km`;
    if (layerNameReadout) {
      layerNameReadout.textContent = currentLayer.name;
      layerNameReadout.style.color = currentLayer.color;
    }
    if (layerDescReadout) layerDescReadout.textContent = currentLayer.description;
    if (speedReadout) speedReadout.textContent = `${velocityKmh.toLocaleString()} km/h`;
    if (gravityReadout) gravityReadout.textContent = `${localGravity} m/s²`;
    if (tempReadout) tempReadout.textContent = `${estimatedTemp.toLocaleString()} °C`;
    if (pressureReadout) pressureReadout.textContent = `${estimatedPressure} GPa`;

    // Highlight active layer row
    document.querySelectorAll('.geology-row').forEach(row => {
      row.classList.toggle('active-layer', row.dataset.layerId === currentLayer.id);
    });
  }

  toggleDrillSimulation() {
    const playBtn = document.getElementById('btn-play-drill');
    const drillSlider = document.getElementById('drill-depth-slider');

    if (this.isDrilling) {
      // Stop
      clearInterval(this.drillAnimationTimer);
      this.isDrilling = false;
      if (playBtn) playBtn.innerHTML = '<span>Run simulation</span>';
      return;
    }

    // Start
    this.isDrilling = true;
    if (playBtn) playBtn.innerHTML = '<span>Pause Transit</span>';

    let currentDepth = parseFloat(drillSlider.value) || 0;
    if (currentDepth >= EARTH_DIAMETER_KM - 50) currentDepth = 0;

    const totalKm = EARTH_DIAMETER_KM;
    const stepKm = 95; // Animation step

    this.drillAnimationTimer = setInterval(() => {
      currentDepth += stepKm;
      if (currentDepth >= totalKm) {
        currentDepth = totalKm;
        clearInterval(this.drillAnimationTimer);
        this.isDrilling = false;
        if (playBtn) playBtn.innerHTML = '<span>Replay simulation</span>';
        this.showToast("Emergence: Reached Antipode on the other side of Earth.");
      }

      drillSlider.value = currentDepth;
      this.updateDrillPhysics(currentDepth);
    }, 45);
  }

  renderFamousAntipodes() {
    const container = document.getElementById('famous-antipodes-list');
    if (!container) return;

    container.innerHTML = '';
    FAMOUS_ANTIPODES.forEach(item => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'preset-card';
      card.innerHTML = `
        <div class="preset-header">
          <span class="preset-title">${item.name}</span>
          <span class="preset-tag ${item.isLandToLand ? 'tag-land' : 'tag-ocean'}">${item.tag}</span>
        </div>
        <p class="preset-desc">${item.description}</p>
        <div class="preset-footer">
          <span class="preset-btn">Load Trajectory &rarr;</span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.updateCoordinates(item.departure.lat, item.departure.lon, true);
        this.switchMainView('globe');
        document.querySelectorAll('.nav-tab-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.view === 'globe');
        });
        this.showToast(`Loaded: ${item.name}`);
      });

      container.appendChild(card);
    });
  }

  renderGeologyLayers() {
    const container = document.getElementById('geology-layers-list');
    if (!container) return;

    container.innerHTML = '';
    EARTH_GEOLOGY_LAYERS.forEach(layer => {
      const row = document.createElement('div');
      row.className = 'geology-row';
      row.dataset.layerId = layer.id;
      row.innerHTML = `
        <div class="layer-indicator" style="background-color: ${layer.color};"></div>
        <div class="layer-info">
          <div class="layer-header">
            <span class="layer-title">${layer.name}</span>
            <span class="layer-depth">${layer.depthStartKm} – ${layer.depthEndKm} km</span>
          </div>
          <div class="layer-meta">
            <span>Temp: ${layer.tempRange}</span>
            <span>Pressure: ${layer.pressureRange}</span>
            <span>Phase: ${layer.state}</span>
          </div>
        </div>
      `;
      container.appendChild(row);
    });
  }

  showToast(message, type = 'info') {
    const existing = document.querySelector('.app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.bigTunnelApp = new BigTunnelApp();
});
