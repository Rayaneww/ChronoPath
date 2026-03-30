const {
  calculateTargetDistance,
  radiusFromDistance,
  generateWaypoints
} = require('../src/services/loopGenerator');

describe('calculateTargetDistance', () => {
  test('returns flat distance when no elevation', () => {
    // 30min à 10km/h = 5km
    expect(calculateTargetDistance(30, 10, 0)).toBeCloseTo(5.0, 2);
  });

  test('reduces distance for elevation gain (Naismith rule)', () => {
    // 30min à 10km/h = 5km flat. 300m gain = 0.5h extra → 4.5km
    expect(calculateTargetDistance(30, 10, 300)).toBeCloseTo(4.5, 2);
  });

  test('never returns negative distance', () => {
    expect(calculateTargetDistance(10, 5, 10000)).toBeGreaterThan(0);
  });

  test('15min à 5km/h = 1.25km', () => {
    expect(calculateTargetDistance(15, 5, 0)).toBeCloseTo(1.25, 2);
  });
});

describe('radiusFromDistance', () => {
  test('5km loop → radius ≈ 796m', () => {
    expect(radiusFromDistance(5)).toBeCloseTo(795.8, 0);
  });

  test('10km loop → radius ≈ 1592m', () => {
    expect(radiusFromDistance(10)).toBeCloseTo(1591.5, 0);
  });
});

describe('generateWaypoints', () => {
  test('generates the requested number of waypoints', () => {
    const wps = generateWaypoints(48.8566, 2.3522, 500, 4);
    expect(wps).toHaveLength(4);
  });

  test('each waypoint has lat and lng', () => {
    const wps = generateWaypoints(48.8566, 2.3522, 500, 4);
    wps.forEach(wp => {
      expect(typeof wp.lat).toBe('number');
      expect(typeof wp.lng).toBe('number');
    });
  });

  test('waypoints are at approximately the correct radius from center', () => {
    const lat = 48.8566, lng = 2.3522, radius = 500;
    const wps = generateWaypoints(lat, lng, radius, 4);
    wps.forEach(wp => {
      const dLat = (wp.lat - lat) * 111320;
      const dLng = (wp.lng - lng) * 111320 * Math.cos(lat * Math.PI / 180);
      const dist = Math.sqrt(dLat ** 2 + dLng ** 2);
      expect(dist).toBeCloseTo(radius, -1); // ±50m tolerance
    });
  });
});
