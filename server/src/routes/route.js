const express = require('express');
const { body, validationResult } = require('express-validator');
const { getRoute } = require('../services/graphhopper');
const { getElevationGain } = require('../services/elevation');
const {
  calculateTargetDistance,
  radiusFromDistance,
  generateWaypoints
} = require('../services/loopGenerator');

const router = express.Router();
const MAX_ITERATIONS = 3;
const TOLERANCE = 0.1; // ±10%

router.post(
  '/generate',
  [
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
    body('activite').isIn(['marche', 'course', 'velo']),
    body('duree').isInt({ min: 5, max: 180 }),
    body('vitesse').isFloat({ min: 2, max: 50 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { lat, lng, activite, duree, vitesse } = req.body;
    const apiKey = process.env.GRAPHHOPPER_API_KEY;

    try {
      let targetDistance = calculateTargetDistance(duree, vitesse, 0);
      let radius = radiusFromDistance(targetDistance);
      let route;

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        // waypoints : départ → 4 points en cercle → retour départ
        const circlePoints = generateWaypoints(lat, lng, radius, 4);
        const waypoints = [{ lat, lng }, ...circlePoints, { lat, lng }];

        route = await getRoute({ waypoints, profile: activite, apiKey });

        const elevGain = await getElevationGain(route.geojson.coordinates);
        route.elevationGainM = elevGain;

        const adjustedTarget = calculateTargetDistance(duree, vitesse, elevGain);
        const ratio = adjustedTarget / route.distanceKm;

        if (Math.abs(ratio - 1) <= TOLERANCE) break;
        radius = radius * ratio;
      }

      res.json({
        geojson: route.geojson,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        elevationGainM: route.elevationGainM
      });
    } catch (err) {
      if (err.message.startsWith('GraphHopper error')) {
        return res.status(422).json({ error: err.message });
      }
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

module.exports = router;
