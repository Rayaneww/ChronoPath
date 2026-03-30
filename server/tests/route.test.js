const request = require('supertest');
const nock = require('nock');
const app = require('../src/app');

afterEach(() => nock.cleanAll());

const mockGHResponse = {
  paths: [{
    distance: 4850,
    time: 2910000,
    points: {
      type: 'LineString',
      coordinates: [[2.347, 48.859], [2.350, 48.862], [2.347, 48.859]]
    },
    ascend: 30
  }]
};

const mockElevationResponse = {
  results: [
    { latitude: 48.859, longitude: 2.347, elevation: 35 },
    { latitude: 48.862, longitude: 2.350, elevation: 55 },
    { latitude: 48.859, longitude: 2.347, elevation: 35 }
  ]
};

function mockExternalAPIs() {
  // Mock multiple GH calls (up to 3 iterations)
  nock('https://graphhopper.com').post('/api/1/route').query(true).times(3).reply(200, mockGHResponse);
  nock('https://api.open-elevation.com').post('/api/v1/lookup').times(3).reply(200, mockElevationResponse);
}

describe('POST /api/route/generate', () => {
  test('returns route with required fields', async () => {
    mockExternalAPIs();
    const res = await request(app).post('/api/route/generate').send({
      lat: 48.8566,
      lng: 2.3522,
      activite: 'course',
      duree: 30,
      vitesse: 10
    });
    expect(res.status).toBe(200);
    expect(res.body.geojson).toBeDefined();
    expect(res.body.distanceKm).toBeDefined();
    expect(res.body.durationMin).toBeDefined();
    expect(res.body.elevationGainM).toBeDefined();
  });

  test('returns 400 if lat is missing', async () => {
    const res = await request(app).post('/api/route/generate').send({
      lng: 2.3522, activite: 'course', duree: 30, vitesse: 10
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 if duree is out of range (>180)', async () => {
    const res = await request(app).post('/api/route/generate').send({
      lat: 48.8566, lng: 2.3522, activite: 'course', duree: 200, vitesse: 10
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 if activite is invalid', async () => {
    const res = await request(app).post('/api/route/generate').send({
      lat: 48.8566, lng: 2.3522, activite: 'natation', duree: 30, vitesse: 10
    });
    expect(res.status).toBe(400);
  });
});
