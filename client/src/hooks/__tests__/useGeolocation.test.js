import { renderHook, waitFor } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import useGeolocation from '../useGeolocation';

beforeEach(() => {
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition: vi.fn() },
    configurable: true,
    writable: true
  });
});

test('returns GPS position on success', async () => {
  vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success) =>
    success({ coords: { latitude: 48.8566, longitude: 2.3522 } })
  );

  const { result } = renderHook(() => useGeolocation());
  await waitFor(() => expect(result.current.position).not.toBeNull());

  expect(result.current.position).toEqual({ lat: 48.8566, lng: 2.3522 });
  expect(result.current.error).toBeNull();
});

test('falls back to Paris and sets error message on denied permission', async () => {
  vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((_, error) =>
    error(new Error('Permission denied'))
  );

  const { result } = renderHook(() => useGeolocation());
  await waitFor(() => expect(result.current.position).not.toBeNull());

  expect(result.current.position).toEqual({ lat: 48.8566, lng: 2.3522 });
  expect(result.current.error).toBe('Autorisez la géolocalisation pour un meilleur résultat');
});
