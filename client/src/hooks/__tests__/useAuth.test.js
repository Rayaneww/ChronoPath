import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import useAuth from '../useAuth';
import * as authApi from '../../api/auth';

vi.mock('../../api/auth');

beforeEach(() => localStorage.clear());

test('initializes as logged out when no token in localStorage', () => {
  const { result } = renderHook(() => useAuth());
  expect(result.current.user).toBeNull();
});

test('login stores token and user, sets user state', async () => {
  authApi.login.mockResolvedValue({ token: 'tok123', user: { id: '1', email: 'a@b.com' } });

  const { result } = renderHook(() => useAuth());
  await act(async () => { await result.current.login('a@b.com', 'pass'); });

  expect(localStorage.getItem('token')).toBe('tok123');
  expect(result.current.user).toEqual({ id: '1', email: 'a@b.com' });
});

test('logout clears localStorage and user state', async () => {
  authApi.login.mockResolvedValue({ token: 'tok123', user: { id: '1', email: 'a@b.com' } });

  const { result } = renderHook(() => useAuth());
  await act(async () => { await result.current.login('a@b.com', 'pass'); });
  act(() => result.current.logout());

  expect(localStorage.getItem('token')).toBeNull();
  expect(result.current.user).toBeNull();
});
