const axios = require('axios');

const PROFILE_MAP = {
  marche: 'foot',
  course: 'foot',
  velo: 'bike'
};

async function getRoute({ waypoints, profile, apiKey }) {
  // GraphHopper uses [longitude, latitude] order
  const points = waypoints.map(({ lng, lat }) => [lng, lat]);

  let response;
  try {
    response = await axios.post(
      'https://graphhopper.com/api/1/route',
      {
        points,
        profile: PROFILE_MAP[profile] || profile,
        instructions: false,
        calc_points: true,
        points_encoded: false,
        elevation: true
      },
      { params: { key: apiKey } }
    );
  } catch (err) {
    throw new Error(`GraphHopper error: ${err.response?.data?.message || err.message}`);
  }

  const path = response.data.paths[0];
  return {
    distanceKm: path.distance / 1000,
    durationMin: path.time / 60000,
    elevationGainM: Math.round(path.ascend || 0),
    geojson: path.points  // GeoJSON LineString
  };
}

module.exports = { getRoute, PROFILE_MAP };
