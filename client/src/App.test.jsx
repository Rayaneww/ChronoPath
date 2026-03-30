import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('./components/Map', () => ({ default: () => <div data-testid="map" /> }));
vi.mock('./components/Panel', () => ({
  default: ({ onGenerate }) => (
    <button onClick={() => onGenerate({ activite: 'course', duree: 30, vitesse: 10 })}>
      Generate
    </button>
  )
}));
vi.mock('./components/AuthModal', () => ({ default: () => null }));
vi.mock('./components/FavoritesList', () => ({ default: () => null }));
vi.mock('./hooks/useGeolocation', () => ({
  default: () => ({ position: { lat: 48.8566, lng: 2.3522 }, error: null })
}));
vi.mock('./hooks/useAuth', () => ({
  default: () => ({ user: null, login: vi.fn(), register: vi.fn(), logout: vi.fn() })
}));

import App from './App';

test('renders ChronoPath header', () => {
  render(<App />);
  expect(screen.getByText('ChronoPath')).toBeInTheDocument();
});

test('renders map and panel', () => {
  render(<App />);
  expect(screen.getByTestId('map')).toBeInTheDocument();
  expect(screen.getByText('Generate')).toBeInTheDocument();
});

test('shows login button when not authenticated', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /connexion/i })).toBeInTheDocument();
});
