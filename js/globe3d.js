/**
 * BigTunnel - 3D Wiremesh Earth & Geological Tunnel Visualization (Light Theme)
 * Uses Three.js & OrbitControls
 * solvepao research
 */

import { latLonToCartesian, EARTH_RADIUS_KM } from './antipode.js';

export class Globe3D {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.earthGroup = new THREE.Group();
    this.tunnelGroup = new THREE.Group();
    this.layersGroup = new THREE.Group();
    this.markersGroup = new THREE.Group();
    this.drillCapsule = null;

    this.GLOBE_RADIUS = 100;
    this.currentStart = { lat: 40.4168, lon: -3.7038 }; // Default Madrid
    this.currentAntipode = { lat: -40.4168, lon: 176.2962 }; // Default Weber NZ

    this.isAutoRotating = false;
    this.showWireframe = true;
    this.showCoreLayers = true;
    this.showLandmasses = true;
    this.animationFrameId = null;
    this.clock = new THREE.Clock();

    // Pulse animation state
    this.pulseProgress = 0;
    this.targetCameraPos = null;
    this.isTransitioningCamera = false;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 450;

    // 1. Scene - Pristine Studio Light Backdrop
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    this.camera.position.set(0, 40, 330);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.container.appendChild(this.renderer.domElement);

    // 4. Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 110;
    this.controls.maxDistance = 650;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 0.9;

    // Stop auto-rotate when user drags
    this.controls.addEventListener('start', () => {
      this.isAutoRotating = false;
      const rotateButton = document.getElementById('btn-globe-rotate');
      rotateButton?.classList.remove('active');
      rotateButton?.setAttribute('aria-pressed', 'false');
    });

    // 5. Lighting (Studio Clean Lighting)
    this.setupLighting();

    // 6. Earth Assembly
    this.scene.add(this.earthGroup);
    this.earthGroup.add(this.layersGroup);
    this.earthGroup.add(this.tunnelGroup);
    this.earthGroup.add(this.markersGroup);

    this.buildEarthSurface();
    this.buildGeologicalLayers();
    this.loadCoastlines();
    this.buildDrillCapsule();

    // 7. Update initial tunnel and markers
    this.updateLocations(this.currentStart.lat, this.currentStart.lon, this.currentAntipode.lat, this.currentAntipode.lon);

    // 8. Resize listener
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // 9. Fit the globe to narrow screens before the first frame.
    this.onWindowResize();
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight1.position.set(200, 300, 200);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 0.5);
    dirLight2.position.set(-200, -200, -200);
    this.scene.add(dirLight2);

    const coreLight = new THREE.PointLight(0xf59e0b, 1.2, 300);
    coreLight.position.set(0, 0, 0);
    this.scene.add(coreLight);
  }

  buildEarthSurface() {
    // 1. Semi-translucent Ocean sphere body (Soft celestial ocean blue in light mode)
    const bodyGeo = new THREE.SphereGeometry(this.GLOBE_RADIUS - 0.4, 64, 64);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0xd9e8df,
      emissive: 0x547f6b,
      emissiveIntensity: 0.1,
      specular: 0xffffff,
      shininess: 8,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    });
    this.earthBody = new THREE.Mesh(bodyGeo, bodyMat);
    this.earthGroup.add(this.earthBody);

    // A geographic graticule: clean parallels and meridians, without triangle edges.
    this.wireMesh = new THREE.Group();
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x588579, transparent: true, opacity: 0.32, depthWrite: false
    });
    const addGridLine = points => {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.wireMesh.add(new THREE.Line(geometry, gridMaterial));
    };
    for (let lat = -75; lat <= 75; lat += 15) {
      const points = [];
      for (let lon = -180; lon <= 180; lon += 3) {
        const p = this.to3D(lat, lon, this.GLOBE_RADIUS);
        points.push(new THREE.Vector3(p.x, p.y, p.z));
      }
      addGridLine(points);
    }
    for (let lon = -180; lon < 180; lon += 15) {
      const points = [];
      for (let lat = -90; lat <= 90; lat += 3) {
        const p = this.to3D(lat, lon, this.GLOBE_RADIUS);
        points.push(new THREE.Vector3(p.x, p.y, p.z));
      }
      addGridLine(points);
    }
    this.earthGroup.add(this.wireMesh);

    // 3. Equator and Prime Meridian rings
    const equatorGeo = new THREE.RingGeometry(this.GLOBE_RADIUS + 0.1, this.GLOBE_RADIUS + 0.6, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const equator = new THREE.Mesh(equatorGeo, ringMat);
    equator.rotation.x = Math.PI / 2;
    this.earthGroup.add(equator);

    // 4. Subtle Outer Atmosphere Ring
    const atmosGeo = new THREE.SphereGeometry(this.GLOBE_RADIUS * 1.05, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide
    });
    this.atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    this.earthGroup.add(this.atmosphere);
  }

  buildGeologicalLayers() {
    // 1. Inner Core (Solid crystalline sphere, radiant warm gold)
    const innerCoreGeo = new THREE.SphereGeometry(19.1, 32, 32);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0xc18b48,
      transparent: true,
      opacity: 0.95
    });
    this.innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    this.layersGroup.add(this.innerCore);

    // Inner Core Glow halo
    const innerHaloGeo = new THREE.SphereGeometry(22, 32, 32);
    const innerHaloMat = new THREE.MeshBasicMaterial({
      color: 0xdbb47b,
      transparent: true,
      opacity: 0.12,
      blending: THREE.NormalBlending
    });
    this.layersGroup.add(new THREE.Mesh(innerHaloGeo, innerHaloMat));

    // 2. Liquid Outer Core (Molten vibrant coral orange)
    const outerCoreGeo = new THREE.SphereGeometry(54.6, 32, 32);
    const outerCoreMat = new THREE.MeshPhongMaterial({
      color: 0xc99359,
      emissive: 0x7a532c,
      transparent: true,
      opacity: 0.16,
      wireframe: false,
      depthWrite: false
    });
    this.outerCore = new THREE.Mesh(outerCoreGeo, outerCoreMat);
    this.layersGroup.add(this.outerCore);

    // 3. Lower Mantle Shell (Warm amber wiremesh)
    const mantleGeo = new THREE.SphereGeometry(84.8, 32, 32);
    const mantleMat = new THREE.MeshBasicMaterial({
      color: 0xd2b586,
      wireframe: false,
      transparent: true,
      opacity: 0.08,
      depthWrite: false
    });
    this.mantle = new THREE.Mesh(mantleGeo, mantleMat);
    this.layersGroup.add(this.mantle);
  }

  async loadCoastlines() {
    try {
      const response = await fetch('assets/coastlines.json');
      if (!response.ok) throw new Error("Could not load coastlines.json");
      const rings = await response.json();

      // Deep Navy / Midnight Slate coastlines for crisp contrast on light globe
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x294c40,
        transparent: true,
        opacity: 0.8,
        linewidth: 1
      });

      const coastGroup = new THREE.Group();

      rings.forEach(ring => {
        if (ring.length < 2) return;
        const points = [];
        ring.forEach(([lon, lat]) => {
          const pos = this.to3D(lat, lon, this.GLOBE_RADIUS + 0.2);
          points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        });

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geo, lineMaterial);
        coastGroup.add(line);
      });

      this.coastlinesMesh = coastGroup;
      this.earthGroup.add(coastGroup);
    } catch (err) {
      console.warn("Coastlines load fallback:", err);
      this.drawFallbackCoastlines();
    }
  }

  drawFallbackCoastlines() {
    const fallbackGroup = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0x0f172a, opacity: 0.5, transparent: true });

    [-60, -30, 0, 30, 60].forEach(lat => {
      const points = [];
      for (let lon = -180; lon <= 180; lon += 5) {
        const p = this.to3D(lat, lon, this.GLOBE_RADIUS + 0.2);
        points.push(new THREE.Vector3(p.x, p.y, p.z));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      fallbackGroup.add(new THREE.Line(geo, mat));
    });

    this.earthGroup.add(fallbackGroup);
  }

  to3D(lat, lon, radius = this.GLOBE_RADIUS) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return {
      x: -radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta)
    };
  }

  buildDrillCapsule() {
    const capsuleGroup = new THREE.Group();

    const sphereGeo = new THREE.SphereGeometry(3.0, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a
    });
    capsuleGroup.add(new THREE.Mesh(sphereGeo, sphereMat));

    const ringGeo = new THREE.RingGeometry(3.4, 4.8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe11d48,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    this.capsuleRing = new THREE.Mesh(ringGeo, ringMat);
    capsuleGroup.add(this.capsuleRing);

    this.drillCapsule = capsuleGroup;
    this.drillCapsule.visible = false;
    this.earthGroup.add(capsuleGroup);
  }

  updateLocations(lat1, lon1, lat2, lon2) {
    this.currentStart = { lat: lat1, lon: lon1 };
    this.currentAntipode = { lat: lat2, lon: lon2 };

    const p1 = this.to3D(lat1, lon1, this.GLOBE_RADIUS);
    const p2 = this.to3D(lat2, lon2, this.GLOBE_RADIUS);

    const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
    const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);

    this.startVec = v1;
    this.antipodeVec = v2;

    this.rebuildTunnel(v1, v2);
    this.rebuildMarkers(v1, v2);
  }

  rebuildTunnel(v1, v2) {
    while (this.tunnelGroup.children.length > 0) {
      const obj = this.tunnelGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      this.tunnelGroup.remove(obj);
    }

    const distance = v1.distanceTo(v2);
    const midPoint = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);

    // 1. Outer Translucent Laser Sheath (Blue)
    const outerCylinderGeo = new THREE.CylinderGeometry(2.2, 2.2, distance, 24, 1, true);
    const outerCylinderMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const outerCylinder = new THREE.Mesh(outerCylinderGeo, outerCylinderMat);

    // 2. Inner Intense Laser Core (Rose/Ruby)
    const innerCylinderGeo = new THREE.CylinderGeometry(0.9, 0.9, distance, 16, 1, true);
    const innerCylinderMat = new THREE.MeshBasicMaterial({
      color: 0xe11d48,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });
    const innerCylinder = new THREE.Mesh(innerCylinderGeo, innerCylinderMat);

    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);

    outerCylinder.position.copy(midPoint);
    outerCylinder.quaternion.copy(quaternion);

    innerCylinder.position.copy(midPoint);
    innerCylinder.quaternion.copy(quaternion);

    this.tunnelGroup.add(outerCylinder);
    this.tunnelGroup.add(innerCylinder);

    // 3. Traveling Pulse Ring
    const pulseGeo = new THREE.RingGeometry(0.5, 3.4, 24);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xe11d48,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    this.pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    this.pulseMesh.quaternion.copy(quaternion);
    this.pulseMesh.rotateX(Math.PI / 2);
    this.tunnelGroup.add(this.pulseMesh);
  }

  rebuildMarkers(v1, v2) {
    while (this.markersGroup.children.length > 0) {
      const obj = this.markersGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      this.markersGroup.remove(obj);
    }

    // Point A Marker (Azure Blue start beacon)
    const markerA = this.createBeacon(v1, 0x0284c7, 0x38bdf8, "A");
    this.markersGroup.add(markerA);
    this.beaconA = markerA;

    // Point B Marker (Ruby Rose antipode beacon)
    const markerB = this.createBeacon(v2, 0xe11d48, 0xfb7185, "B");
    this.markersGroup.add(markerB);
    this.beaconB = markerB;
  }

  createBeacon(position, primaryColor, secondaryColor) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.lookAt(new THREE.Vector3(0, 0, 0));

    // 1. Surface disc
    const discGeo = new THREE.CircleGeometry(3.5, 32);
    const discMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.z = -0.3;
    group.add(disc);

    // 2. Concentric Pulsing Radar Ring
    const ringGeo = new THREE.RingGeometry(3.8, 5.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = -0.4;
    group.add(ring);

    // 3. Spire / Vertical Needle
    const needleGeo = new THREE.CylinderGeometry(0.3, 0.8, 14, 12);
    const needleMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.95
    });
    const needle = new THREE.Mesh(needleGeo, needleMat);
    needle.rotation.x = Math.PI / 2;
    needle.position.z = -7;
    group.add(needle);

    // 4. Glowing beacon sphere on top
    const topSphereGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const topSphereMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });
    const topSphere = new THREE.Mesh(topSphereGeo, topSphereMat);
    topSphere.position.z = -14;
    group.add(topSphere);

    return group;
  }

  setDrillPositionRatio(ratio) {
    if (!this.startVec || !this.antipodeVec) return;

    this.drillCapsule.visible = true;
    const clamped = Math.max(0, Math.min(1, ratio));
    const currentPos = new THREE.Vector3().lerpVectors(this.startVec, this.antipodeVec, clamped);
    this.drillCapsule.position.copy(currentPos);
  }

  hideDrillCapsule() {
    if (this.drillCapsule) {
      this.drillCapsule.visible = false;
    }
  }

  setCameraView(mode) {
    if (!this.startVec || !this.antipodeVec) return;
    this.isAutoRotating = false;

    const targetLook = new THREE.Vector3(0, 0, 0);

    if (mode === 'cross-section') {
      const tunnelDir = new THREE.Vector3().subVectors(this.antipodeVec, this.startVec).normalize();
      let perp = new THREE.Vector3(0, 1, 0).cross(tunnelDir);
      if (perp.lengthSq() < 0.001) {
        perp = new THREE.Vector3(1, 0, 0).cross(tunnelDir);
      }
      perp.normalize().multiplyScalar(240);
      this.animateCameraTo(perp, targetLook);
    } else if (mode === 'start') {
      const camPos = this.startVec.clone().normalize().multiplyScalar(220);
      this.animateCameraTo(camPos, targetLook);
    } else if (mode === 'antipode') {
      const camPos = this.antipodeVec.clone().normalize().multiplyScalar(220);
      this.animateCameraTo(camPos, targetLook);
    } else if (mode === 'core') {
      const tunnelDir = new THREE.Vector3().subVectors(this.antipodeVec, this.startVec).normalize();
      let perp = new THREE.Vector3(0, 1, 0).cross(tunnelDir);
      if (perp.lengthSq() < 0.001) perp = new THREE.Vector3(1, 0, 0).cross(tunnelDir);
      perp.normalize().multiplyScalar(135);
      this.animateCameraTo(perp, targetLook);
    }
  }

  animateCameraTo(targetPos, targetLookAt) {
    this.targetCameraPos = targetPos;
    this.targetLookAt = targetLookAt || new THREE.Vector3(0, 0, 0);
    this.isTransitioningCamera = true;
  }

  toggleAutoRotate() {
    this.isAutoRotating = !this.isAutoRotating;
    return this.isAutoRotating;
  }

  toggleWireframe() {
    this.showWireframe = !this.showWireframe;
    this.wireMesh.visible = this.showWireframe;
    return this.showWireframe;
  }

  toggleCoreLayers() {
    this.showCoreLayers = !this.showCoreLayers;
    this.layersGroup.visible = this.showCoreLayers;
    return this.showCoreLayers;
  }

  toggleXRay() {
    if (this.earthBody.material.opacity > 0.15) {
      this.earthBody.material.opacity = 0.08;
      this.earthBody.material.needsUpdate = true;
      return true;
    } else {
      this.earthBody.material.opacity = 0.32;
      this.earthBody.material.needsUpdate = true;
      return false;
    }
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.fov = 2 * Math.atan(Math.tan(45 * Math.PI / 360) / Math.min(1, width / height)) * 180 / Math.PI;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    if (this.isTransitioningCamera && this.targetCameraPos) {
      this.camera.position.lerp(this.targetCameraPos, 0.08);
      this.controls.target.lerp(this.targetLookAt, 0.08);
      if (this.camera.position.distanceTo(this.targetCameraPos) < 1.0) {
        this.camera.position.copy(this.targetCameraPos);
        this.controls.target.copy(this.targetLookAt);
        this.isTransitioningCamera = false;
      }
    }

    if (this.isAutoRotating && !this.isTransitioningCamera) {
      this.earthGroup.rotation.y += 0.0025;
    }

    if (this.pulseMesh && this.startVec && this.antipodeVec) {
      this.pulseProgress = (this.pulseProgress + delta * 0.4) % 1.0;
      const pulsePos = new THREE.Vector3().lerpVectors(this.startVec, this.antipodeVec, this.pulseProgress);
      this.pulseMesh.position.copy(pulsePos);

      const scale = 1.0 + 0.3 * Math.sin(this.pulseProgress * Math.PI * 4);
      this.pulseMesh.scale.set(scale, scale, scale);
    }

    if (this.capsuleRing && this.drillCapsule && this.drillCapsule.visible) {
      this.capsuleRing.rotation.z += 0.05;
    }

    if (this.beaconA && this.beaconB) {
      const s = 1.0 + 0.15 * Math.sin(elapsedTime * 4);
      this.beaconA.children[1].scale.set(s, s, s);
      this.beaconB.children[1].scale.set(s, s, s);
    }

    if (this.innerCore) {
      const corePulse = 1.0 + 0.03 * Math.sin(elapsedTime * 2);
      this.innerCore.scale.set(corePulse, corePulse, corePulse);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
