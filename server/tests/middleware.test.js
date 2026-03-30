const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middleware/auth');

const testApp = express();
testApp.use(express.json());
testApp.get('/protected', authMiddleware, (req, res) => res.json({ userId: req.userId }));

test('allows request with valid JWT', async () => {
  const token = jwt.sign({ userId: 'abc-123' }, 'test_secret_do_not_use_in_prod', { expiresIn: '1h' });
  const res = await request(testApp)
    .get('/protected')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body.userId).toBe('abc-123');
});

test('rejects request without token', async () => {
  const res = await request(testApp).get('/protected');
  expect(res.status).toBe(401);
});

test('rejects request with invalid token', async () => {
  const res = await request(testApp)
    .get('/protected')
    .set('Authorization', 'Bearer invalid.token.here');
  expect(res.status).toBe(401);
});
