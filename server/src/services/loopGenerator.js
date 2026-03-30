/**
 * Calcule la distance cible en km, ajustée pour le dénivelé.
 * Formule de Naismith : +1h pour chaque 600m de dénivelé positif.
 */
function calculateTargetDistance(durationMin, speedKmh, elevationGainM = 0) {
  const totalTimeH = durationMin / 60;
  const elevationTimeH = elevationGainM / 6000;
  const flatTimeH = Math.max(totalTimeH - elevationTimeH, 0.02); // minimum 0.02h
  return flatTimeH * speedKmh;
}

/**
 * Calcule le rayon d'un cercle dont le périmètre est la distance donnée.
 * distance en km → rayon en mètres
 */
function radiusFromDistance(distanceKm) {
  return (distanceKm * 1000) / (2 * Math.PI);
}

/**
 * Génère des waypoints en cercle autour d'un point central.
 * Retourne des objets { lat, lng }.
 */
function generateWaypoints(lat, lng, radiusMeters, numPoints = 4) {
  const deltaLat = radiusMeters / 111320;
  const deltaLng = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));
  const waypoints = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    waypoints.push({
      lat: lat + deltaLat * Math.sin(angle),
      lng: lng + deltaLng * Math.cos(angle)
    });
  }
  return waypoints;
}

module.exports = { calculateTargetDistance, radiusFromDistance, generateWaypoints };
