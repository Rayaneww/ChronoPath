import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Polyline: ({ positions }) => (
    <div data-testid="polyline" data-count={positions.length} />
  ),
  Marker: () => <div data-testid="marker" />,
  useMap: () => ({ setView: vi.fn() })
}));

vi.mock('leaflet', () => ({
  default: { Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } } }
}));

import Map from '../Map';

test('renders map container', () => {
  render(<Map position={{ lat: 48.8566, lng: 2.3522 }} route={null} />);
  expect(screen.getByTestId('map')).toBeInTheDocument();
});

test('renders marker at current position', () => {
  render(<Map position={{ lat: 48.8566, lng: 2.3522 }} route={null} />);
  expect(screen.getByTestId('marker')).toBeInTheDocument();
});

test('renders polyline when route has coordinates', () => {
  const route = {
    geojson: {
      type: 'LineString',
      coordinates: [[2.347, 48.859], [2.350, 48.862], [2.347, 48.859]]
    }
  };
  render(<Map position={{ lat: 48.8566, lng: 2.3522 }} route={route} />);
  expect(screen.getByTestId('polyline')).toBeInTheDocument();
  expect(screen.getByTestId('polyline').dataset.count).toBe('3');
});

test('does not render polyline when route is null', () => {
  render(<Map position={{ lat: 48.8566, lng: 2.3522 }} route={null} />);
  expect(screen.queryByTestId('polyline')).toBeNull();
});
