import { render, screen, fireEvent } from '@testing-library/react';
import TabBar from '../TabBar';

test('renders three tabs: Carte, Favoris, Profil', () => {
  render(<TabBar activeTab="map" onTabChange={vi.fn()} user={null} />);
  expect(screen.getByRole('button', { name: /carte/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /favoris/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /profil/i })).toBeInTheDocument();
});

test('active tab has active class', () => {
  render(<TabBar activeTab="map" onTabChange={vi.fn()} user={null} />);
  expect(screen.getByRole('button', { name: /carte/i })).toHaveClass('active');
  expect(screen.getByRole('button', { name: /favoris/i })).not.toHaveClass('active');
});

test('calls onTabChange with correct tab id when clicking Favoris', () => {
  const onTabChange = vi.fn();
  render(<TabBar activeTab="map" onTabChange={onTabChange} user={null} />);
  fireEvent.click(screen.getByRole('button', { name: /favoris/i }));
  expect(onTabChange).toHaveBeenCalledWith('favorites');
});

test('calls onTabChange with "profile" when clicking Profil', () => {
  const onTabChange = vi.fn();
  render(<TabBar activeTab="map" onTabChange={onTabChange} user={null} />);
  fireEvent.click(screen.getByRole('button', { name: /profil/i }));
  expect(onTabChange).toHaveBeenCalledWith('profile');
});
