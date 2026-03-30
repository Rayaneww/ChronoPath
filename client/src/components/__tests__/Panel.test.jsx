import { render, screen, fireEvent } from '@testing-library/react';
import Panel from '../Panel';

const defaultProps = {
  onGenerate: vi.fn(),
  onSave: vi.fn(),
  onShowFavorites: vi.fn(),
  isLoggedIn: false,
  loading: false,
  error: null,
  route: null
};

test('renders all three activity buttons', () => {
  render(<Panel {...defaultProps} />);
  expect(screen.getByRole('button', { name: /marche/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /course/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /vélo/i })).toBeInTheDocument();
});

test('calls onGenerate with activity, duree, vitesse on click', () => {
  const onGenerate = vi.fn();
  render(<Panel {...defaultProps} onGenerate={onGenerate} />);

  fireEvent.click(screen.getByRole('button', { name: /course/i }));
  fireEvent.click(screen.getByRole('button', { name: /générer/i }));

  expect(onGenerate).toHaveBeenCalledWith(
    expect.objectContaining({ activite: 'course', duree: expect.any(Number), vitesse: expect.any(Number) })
  );
});

test('shows save button only when route exists AND user is logged in', () => {
  const { rerender } = render(<Panel {...defaultProps} />);
  expect(screen.queryByRole('button', { name: /sauvegarder/i })).toBeNull();

  rerender(<Panel {...defaultProps} route={{ distanceKm: 5 }} isLoggedIn={false} />);
  expect(screen.queryByRole('button', { name: /sauvegarder/i })).toBeNull();

  rerender(<Panel {...defaultProps} route={{ distanceKm: 5 }} isLoggedIn={true} />);
  expect(screen.getByRole('button', { name: /sauvegarder/i })).toBeInTheDocument();
});

test('displays error message when error prop is set', () => {
  render(<Panel {...defaultProps} error="Pas d'itinéraire possible" />);
  expect(screen.getByText("Pas d'itinéraire possible")).toBeInTheDocument();
});
