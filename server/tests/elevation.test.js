const nock = require('nock');
const { getElevationGain } = require('../src/services/elevation');

afterEach(() => nock.cleanAll());

test('getElevationGain returns positive gain only', async () => {
  nock('https://api.open-elevation.com')
    .post('/api/v1/lookup')
    .reply(200, {
      results: [
        { latitude: 48.859, longitude: 2.347, elevation: 35 },
        { latitude: 48.862, longitude: 2.350, elevation: 55 },
        { latitude: 48.864, longitude: 2.352, elevation: 50 },
        { latitude: 48.859, longitude: 2.347, elevation: 35 }
      ]
    });

  // Up: 35→55 = +20, 55→50 = ignored (descent), 50→35 = ignored
  const result = await getElevationGain([[2.347, 48.859], [2.350, 48.862], [2.352, 48.864], [2.347, 48.859]]);
  expect(result).toBe(20);
});

test('getElevationGain returns 0 on API failure (fallback)', async () => {
  nock('https://api.open-elevation.com')
    .post('/api/v1/lookup')
    .reply(500);

  const result = await getElevationGain([[2.347, 48.859]]);
  expect(result).toBe(0);
});
