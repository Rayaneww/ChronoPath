import { vi } from 'vitest';
import { login, register } from '../auth';

vi.mock('../client', () => ({
  default: {
    post: vi.fn()
  }
}));

import apiClient from '../client';

test('login calls POST /api/auth/login with credentials', async () => {
  apiClient.post.mockResolvedValue({ data: { token: 'abc', user: { id: '1', email: 'a@b.com' } } });
  const result = await login('a@b.com', 'password123');
  expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
    email: 'a@b.com',
    password: 'password123'
  });
  expect(result.token).toBe('abc');
});

test('register calls POST /api/auth/register', async () => {
  apiClient.post.mockResolvedValue({ data: { token: 'xyz', user: { id: '2', email: 'b@c.com' } } });
  const result = await register('b@c.com', 'pass123');
  expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register', {
    email: 'b@c.com',
    password: 'pass123'
  });
  expect(result.token).toBe('xyz');
});
