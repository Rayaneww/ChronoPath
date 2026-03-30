const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

let token, userId;

beforeAll(async () => {
  await pool.query("DELETE FROM users WHERE email = 'saved@example.com'");
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'saved@example.com', password: 'password123' });
  token = res.body.token;
  userId = res.body.user.id;
});

beforeEach(async () => {
  await pool.query('DELETE FROM saved_routes WHERE user_id = ?', [userId]);
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email = 'saved@example.com'");
  await pool.end();
});

const sampleRoute = {
  activite: 'course',
  duree: 30,
  distance: 4.8,
  denivele: 45,
  geojson: { type: 'LineString', coordinates: [[2.347, 48.859], [2.350, 48.862]] }
};

describe('GET /api/routes/saved', () => {
  test('returns empty array when no routes', async () => {
    const res = await request(app)
      .get('/api/routes/saved')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/routes/saved');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/routes/saved', () => {
  test('saves a route and returns it with auto-generated nom', async () => {
    const res = await request(app)
      .post('/api/routes/saved')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleRoute);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.activite).toBe('course');
    expect(res.body.nom).toMatch(/course/i);
  });

  test('returns 401 without token', async () => {
    const res = await request(app).post('/api/routes/saved').send(sampleRoute);
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/routes/saved/:id', () => {
  test('deletes a saved route', async () => {
    const created = await request(app)
      .post('/api/routes/saved')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleRoute);
    const id = created.body.id;

    const res = await request(app)
      .delete(`/api/routes/saved/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  test('returns 404 for non-existent route', async () => {
    const res = await request(app)
      .delete('/api/routes/saved/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
