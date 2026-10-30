# BigTunnel 🌐🚇

> **What lies on the exact opposite side of the Earth if you dig a tunnel straight through the planetary core?**  
> *Inspired by Jules Verne's "Journey to the Center of the Earth" · solvepao research*

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Static%20Site-blue.svg)](https://solvepao.github.io/BigTunnel/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)
[![Three.js](https://img.shields.io/badge/3D-Three.js-black.svg)](https://threejs.org/)
[![Leaflet](https://img.shields.io/badge/Maps-OpenStreetMap%20%2F%20Leaflet-brightgreen.svg)](https://leafletjs.com/)

---

## 🌟 Overview

**BigTunnel** is an interactive planetary geodetic tool and learning simulator that computes the exact antipodal coordinates of any point on Earth. It visualizes the straight-line subterranean trajectory piercing through Earth's crust, mantle, molten outer core, and crystalline inner core to discover what lies directly on the other side.

Designed for researchers, students, educators, and curious minds, BigTunnel works seamlessly across both mobile and desktop screens.

---

## 🚀 Key Features

### 📍 1. Intelligent Location Detection & OpenStreetMap (Zero API Keys)
- **100% Free & Open:** Operates completely without API keys or accounts using standard community-hosted OpenStreetMap tiles.
- **One-Click GPS Geolocation:** Prompt to detect your precise device coordinates via the standard HTML5 Geolocation API.
- **Interactive OpenStreetMap:** Click anywhere on the globe or drag the Departure pin (A) to compute coordinates in real time.
- **Place Search:** Instant geocoding search powered by OpenStreetMap Nominatim—type any city, mountain, island, or monument to jump directly to it.
- **Focus Toggle:** Quickly focus the map between Origin (Point A) and Antipode (Point B) with smooth map animations.

### 🧭 2. Antipodal Geodesy & Direct Navigation Links
- **OpenStreetMap Navigation:** Open the antipode directly in **OpenStreetMap ↗** with a single click.
- **Interactive Map Popups:** Clicking Point B on the map presents immediate a link to launch OpenStreetMap at those exact coordinates.
- **Multi-Format Coordinates:** Displays exact Decimal degrees and Degrees, Minutes, Seconds (DMS).
- **Reverse Geocoding & Ocean Identification:** Automatically classifies whether your tunnel surfaces onto dry land or plunges into an ocean basin (e.g., South Pacific, Indian Ocean, North Atlantic).

### 🌐 3. Interactive 3D Wiremesh Holo-Earth (Three.js)
- **Holographic Wiremesh Globe:** Semi-translucent Earth with glowing latitude/longitude parallels and meridians.
- **Crisp Continent Coastlines:** Vector landmass contours derived from Natural Earth datasets rendered in 3D line segments.
- **Exposed Geological Strata:**
  - **Crust:** Solid brittle shell ($0 - 35\text{ km}$).
  - **Upper & Lower Mantle:** Translucent warm amber convective shell ($35 - 2,890\text{ km}$).
  - **Outer Core:** Molten liquid iron-nickel dynamo ($2,890 - 5,150\text{ km}$).
  - **Inner Core:** Radiant crystalline metallic nucleus ($5,150 - 6,371\text{ km}$).
- **The Laser Borehole:** Luminous 3D beam connecting departure and antipode through $(0,0,0)$ with animated traveling pulse particles.
- **Camera Perspectives:** Preset angles for "Side Cross-Section", "Focus Start (A)", "Focus Antipode (B)", "Center Core", "Auto-Rotate", and "X-Ray Vision".

### 🚇 4. The Gravity Train Simulator
- **Interactive Depth Slider:** Slide from $0\text{ km}$ down to $12,742\text{ km}$ to watch a virtual capsule drop through the Earth.
- **Simple Harmonic Motion (SHM) Telemetry:**
  - Real-time transit velocity (peaks at $\sim 28,472\text{ km/h}$ to $35,690\text{ km/h}$ at the core).
  - Gravity acceleration ($g$ drops linearly to $0.00\text{ m/s}^2$ at the exact center).
  - Core temperature gradient ($\approx 5,700^\circ\text{C}$).
  - Hydrostatic pressure profile ($\approx 364\text{ GPa}$).
- **"Launch Simulation":** Automated gravity drop demonstration.

### 🔬 5. Educational Research & Curated Presets
- **The Antipode Land Paradox:** Explains why only $\sim 4.4\%$ of Earth's land has land on the exact opposite side (most antipodes emerge in the ocean).
- **Curated Famous Pairs:**
  - 🇪🇸 Madrid, Spain ⇄ 🇳🇿 Weber / Palmerston North, New Zealand
  - 🇦🇷 Buenos Aires, Argentina ⇄ 🇨🇳 Shanghai Region, China
  - 🇹🇼 Taipei, Taiwan ⇄ 🇵🇾 Formosa, Argentina
  - 🇨🇱 Valdivia, Chile ⇄ 🇨🇳 Wuhai, Gobi Desert, China
  - 🇺🇸 Honolulu, Hawaii ⇄ 🇧🇼 Kalahari Desert, Botswana
  - 🇺🇸 New York City ⇄ 🌊 Deep South Indian Ocean

---

## 💻 Hosting on GitHub Pages

This repository is built as a **100% static, client-side web application** with zero build tools or servers required.

### Deployment Steps:
1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: BigTunnel static web app"
   git push origin main
   ```
2. Navigate to your repository settings:
   - Go to **Settings** → **Pages**
3. Under **Build and deployment**:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
   - Click **Save**
4. Within 1–2 minutes, your site will be live at:
   `https://solvepao.github.io/BigTunnel/`

---

## 🛠️ Local Development & Testing

Run any local static HTTP server from the project directory:

```bash
# Using Python 3
python3 -m http.server 8080

# Or using Node
npx serve .
```

Open `http://localhost:8080` in your web browser.

---

## 📁 Project Architecture

```
BigTunnel/
├── index.html              # Main HTML5 entry point & semantic markup
├── css/
│   └── style.css           # Modern cyber-geological responsive CSS design system
├── js/
│   ├── app.js              # Application controller & state coordinator
│   ├── antipode.js         # Geodesy math, coordinate conversions & gravity physics
│   ├── globe3d.js          # Three.js 3D wiremesh globe & planetary borehole visualizer
│   ├── map.js              # Leaflet OpenStreetMap controller with custom SVG pins
│   └── data.js             # Famous antipodal presets & Earth geological strata database
├── assets/
│   ├── favicon.svg         # High-resolution planetary tunnel SVG icon
│   └── coastlines.json     # Lightweight vector coastline coordinates for 3D globe
├── vendor/
│   ├── three.min.js        # Three.js WebGL 3D engine (local fallback)
│   ├── OrbitControls.js    # Camera orbital controls
│   ├── leaflet.js          # Leaflet OpenStreetMap library
│   └── leaflet.css         # Leaflet map stylesheet
└── README.md
```

---

## 📄 License & Attribution

- &copy; 2026 BigTunnel · **solvepao research**. All rights reserved.
- Map data &copy; [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), tiles by OpenStreetMap.
- 3D Engine powered by [Three.js](https://threejs.org/).
