import apiClient from './client';

export async function generateRoute(params) {
  const res = await apiClient.post('/api/route/generate', params);
  return res.data;
}

export async function getSavedRoutes() {
  const res = await apiClient.get('/api/routes/saved');
  return res.data;
}

export async function saveRoute(routeData) {
  const res = await apiClient.post('/api/routes/saved', routeData);
  return res.data;
}

export async function deleteRoute(id) {
  await apiClient.delete(`/api/routes/saved/${id}`);
}
