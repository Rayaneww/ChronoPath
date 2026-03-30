const axios = require('axios');

async function getElevationGain(coordinates) {
  try {
    // coordinates are GeoJSON [lng, lat], Open-Elevation wants {latitude, longitude}
    const locations = coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
    const response = await axios.post('https://api.open-elevation.com/api/v1/lookup', { locations });
    const elevations = response.data.results.map(r => r.elevation);

    let gain = 0;
    for (let i = 1; i < elevations.length; i++) {
      const diff = elevations[i] - elevations[i - 1];
      if (diff > 0) gain += diff;
    }
    return Math.round(gain);
  } catch {
    return 0; // fallback silencieux si l'API est indisponible
  }
}

module.exports = { getElevationGain };
