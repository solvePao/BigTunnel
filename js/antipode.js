/**
 * BigTunnel - Antipode Physics & Geodesy Module
 * solvepao research
 */

export const EARTH_RADIUS_KM = 6371.0088; // Mean radius of Earth in km
export const EARTH_DIAMETER_KM = EARTH_RADIUS_KM * 2;
export const GRAVITY_MS2 = 9.80665; // Standard gravity m/s²

/**
 * Calculates the exact antipodal point on the opposite side of Earth.
 * Lat: -lat
 * Lon: lon > 0 ? lon - 180 : lon + 180
 */
export function calculateAntipode(lat, lon) {
  // Normalize input
  const clampedLat = Math.max(-90, Math.min(90, Number(lat) || 0));
  let normalizedLon = Number(lon) || 0;
  
  // Keep lon in [-180, 180]
  normalizedLon = ((normalizedLon + 180) % 360 + 360) % 360 - 180;

  // Antipode coordinates
  const antiLat = clampedLat === 0 ? 0 : -clampedLat;
  let antiLon = normalizedLon > 0 ? normalizedLon - 180 : normalizedLon + 180;
  if (antiLon === -180) antiLon = 180;

  return {
    start: {
      lat: Number(clampedLat.toFixed(5)),
      lon: Number(normalizedLon.toFixed(5))
    },
    antipode: {
      lat: Number(antiLat.toFixed(5)),
      lon: Number(antiLon.toFixed(5))
    }
  };
}

/**
 * Converts decimal degrees to DMS string (e.g. 37° 46' 29.9" N)
 */
export function toDMS(val, isLatitude) {
  const absVal = Math.abs(val);
  const degrees = Math.floor(absVal);
  const minutesNotTruncated = (absVal - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60 * 10) / 10;

  let direction = '';
  if (isLatitude) {
    direction = val >= 0 ? 'N' : 'S';
  } else {
    direction = val >= 0 ? 'E' : 'W';
  }

  return `${degrees}° ${minutes}' ${seconds.toFixed(1)}" ${direction}`;
}

/**
 * Formats a lat/lon pair as DMS
 */
export function formatDMS(lat, lon) {
  return `${toDMS(lat, true)}, ${toDMS(lon, false)}`;
}

/**
 * Formats a lat/lon pair in pretty decimal format (e.g. 40.7128° N, 74.0060° W)
 */
export function formatPrettyDecimal(lat, lon) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

/**
 * Straight line tunnel distance through the Earth (Chord distance)
 * For true antipodes, it equals the exact Earth diameter.
 */
export function calculateTunnelLength(lat1, lon1, lat2, lon2) {
  const p1 = latLonToCartesian(lat1, lon1, EARTH_RADIUS_KM);
  const p2 = latLonToCartesian(lat2, lon2, EARTH_RADIUS_KM);
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Great-circle surface distance in km (Haversine formula)
 */
export function calculateSurfaceDistance(lat1, lon1, lat2, lon2) {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Converts Lat/Lon (degrees) on a sphere of radius R to 3D Cartesian (x, y, z)
 */
export function latLonToCartesian(lat, lon, radius = EARTH_RADIUS_KM) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  };
}

/**
 * Theoretical free-fall transit time through a straight, frictionless evacuated tunnel
 * through the center of a uniform Earth:
 * t = pi * sqrt(R / g) ≈ 42 min 12 sec
 *
 * For realistic PREM (Preliminary Reference Earth Model) density:
 * t ≈ 38 min 11 sec
 */
export function calculateTunnelTransitPhysics() {
  const uniformTimeSec = Math.PI * Math.sqrt((EARTH_RADIUS_KM * 1000) / GRAVITY_MS2);
  const premTimeSec = 38 * 60 + 11; // 38m 11s based on PREM integration
  const maxVelocityUniformKmh = Math.sqrt(GRAVITY_MS2 * (EARTH_RADIUS_KM * 1000)) * 3.6; // ~28,472 km/h
  const maxVelocityPremKmh = 35690; // ~9.91 km/s in PREM

  return {
    uniformTimeSec,
    uniformTimeFormatted: `${Math.floor(uniformTimeSec / 60)}m ${Math.round(uniformTimeSec % 60)}s`,
    premTimeSec,
    premTimeFormatted: "38m 11s",
    maxVelocityKmh: Math.round(maxVelocityUniformKmh),
    maxVelocityMph: Math.round(maxVelocityUniformKmh * 0.621371),
    maxVelocityPremKmh,
    corePressureGpa: 364, // GPa
    coreTempCelsius: 5700 // ~Sun's surface
  };
}

/**
 * Estimates Ocean name based on lat/lon coordinates when outside land bounds
 */
export function estimateOceanName(lat, lon) {
  if (lat > 66.5) return "Arctic Ocean";
  if (lat < -60) return "Southern Ocean (Antarctic)";

  // Atlantic vs Pacific vs Indian
  if (lon >= -70 && lon <= 20) {
    return lat >= 0 ? "North Atlantic Ocean" : "South Atlantic Ocean";
  } else if (lon > 20 && lon < 100) {
    return lat >= 0 ? "Arabian Sea / Bay of Bengal" : "Indian Ocean";
  } else if (lon >= 100 && lon <= 145 && lat > -10 && lat < 25) {
    return "South China / Philippine Sea";
  } else if (lon >= 100 && lon <= 180 && lat < -10) {
    return "Tasman Sea / South Pacific Ocean";
  } else {
    return lat >= 0 ? "North Pacific Ocean" : "South Pacific Ocean";
  }
}

/**
 * Reverse geocodes a location using OpenStreetMap Nominatim API
 * with fallback heuristics if offline or rate-limited.
 */
export async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const country = addr.country || '';
        const state = addr.state || addr.region || addr.province || '';
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
        const ocean = addr.ocean || addr.sea || '';

        const isLand = Boolean(country && !ocean);

        return {
          isLand,
          displayName: data.display_name || (isLand ? `${city ? city + ', ' : ''}${country}` : ocean),
          country: country,
          state: state,
          city: city,
          waterBody: ocean || (isLand ? null : estimateOceanName(lat, lon)),
          raw: data
        };
      }
    }
  } catch (err) {
    console.warn("Reverse geocode fetch failed/timed out, using fallback:", err);
  }

  // Fallback heuristic
  const ocean = estimateOceanName(lat, lon);
  return {
    isLand: false,
    displayName: `${ocean} (Open Ocean)`,
    country: '',
    state: '',
    city: '',
    waterBody: ocean,
    raw: null
  };
}

/**
 * Generates OpenStreetMap URL
 */
export function getOpenStreetMapUrl(lat, lon) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=7/${lat}/${lon}`;
}
