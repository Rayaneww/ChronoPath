import apiClient from './client';

export async function login(email, password) {
  const res = await apiClient.post('/api/auth/login', { email, password });
  return res.data;
}

export async function register(email, password) {
  const res = await apiClient.post('/api/auth/register', { email, password });
  return res.data;
}
