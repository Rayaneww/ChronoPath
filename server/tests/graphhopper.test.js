const nock = require('nock');
const { getRoute } = require('../src/services/graphhopper');

afterEach(() => nock.cleanAll());

const mockGHResponse = {
  paths: [{
    distance: 4850,
    time: 2910000,
    points: {
      type: 'LineString',
      coordinates: [[2.347, 48.859], [2.350, 48.862], [2.347, 48.859]]
    },
    ascend: 45
  }]
};

test('getRoute returns distanceKm, durationMin, elevationGainM and geojson', async () => {
  nock('https://graphhopper.com')
    .post('/api/1/route')
    .query(true)
    .reply(200, mockGHResponse);

  const result = await getRoute({
    waypoints: [{ lat: 48.859, lng: 2.347 }, { lat: 48.862, lng: 2.350 }, { lat: 48.859, lng: 2.347 }],
    profile: 'marche',
    apiKey: 'test_key'
  });

  expect(result.distanceKm).toBeCloseTo(4.85, 1);
  expect(result.durationMin).toBeCloseTo(48.5, 0);
  expect(result.elevationGainM).toBe(45);
  expect(result.geojson.type).toBe('LineString');
  expect(result.geojson.coordinates).toHaveLength(3);
});

test('getRoute throws on API error', async () => {
  nock('https://graphhopper.com')
    .post('/api/1/route')
    .query(true)
    .reply(400, { message: 'Cannot find point near location' });

  await expect(
    getRoute({ waypoints: [{ lat: 0, lng: 0 }, { lat: 0, lng: 0 }], profile: 'marche', apiKey: 'test_key' })
  ).rejects.toThrow('GraphHopper error');
});
