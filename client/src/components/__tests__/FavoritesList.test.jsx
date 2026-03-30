import { render, screen, fireEvent } from '@testing-library/react';
import FavoritesList from '../FavoritesList';

const routes = [
  { id: '1', nom: 'Course 30min – 28 mar', activite: 'course', distance: 4.8, duree: 30 },
  { id: '2', nom: 'Marche 45min – 27 mar', activite: 'marche', distance: 3.5, duree: 45 }
];

test('renders all saved route names', () => {
  render(<FavoritesList routes={routes} onSelect={vi.fn()} onDelete={vi.fn()} />);
  expect(screen.getByText('Course 30min – 28 mar')).toBeInTheDocument();
  expect(screen.getByText('Marche 45min – 27 mar')).toBeInTheDocument();
});

test('calls onSelect with the route when clicking a route name', () => {
  const onSelect = vi.fn();
  render(<FavoritesList routes={routes} onSelect={onSelect} onDelete={vi.fn()} />);
  fireEvent.click(screen.getByText('Course 30min – 28 mar'));
  expect(onSelect).toHaveBeenCalledWith(routes[0]);
});

test('calls onDelete with route id when clicking delete button', () => {
  const onDelete = vi.fn();
  render(<FavoritesList routes={routes} onSelect={vi.fn()} onDelete={onDelete} />);
  const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
  fireEvent.click(deleteButtons[0]);
  expect(onDelete).toHaveBeenCalledWith('1');
});

test('shows empty state when routes array is empty', () => {
  render(<FavoritesList routes={[]} onSelect={vi.fn()} onDelete={vi.fn()} />);
  expect(screen.getByText(/aucun itinéraire sauvegardé/i)).toBeInTheDocument();
});
