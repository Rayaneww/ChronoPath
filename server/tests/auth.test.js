const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

beforeEach(async () => {
  await pool.query('DELETE FROM users');
});

afterAll(() => pool.end());

describe('POST /api/auth/register', () => {
  test('creates a user and returns 201 with token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  test('returns 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123' });
    expect(res.status).toBe(400);
  });

  test('returns 400 if password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: '123' });
    expect(res.status).toBe(400);
  });

  test('returns 409 if email already exists', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'otherpass' });
    expect(res.status).toBe(409);
  });
});
