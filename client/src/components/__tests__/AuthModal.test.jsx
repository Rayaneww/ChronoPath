import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthModal from '../AuthModal';

test('renders login form by default', () => {
  render(<AuthModal onClose={vi.fn()} onAuth={vi.fn()} />);
  expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
});

test('switches to register form when clicking créer un compte', () => {
  render(<AuthModal onClose={vi.fn()} onAuth={vi.fn()} />);
  fireEvent.click(screen.getByText(/créer un compte/i));
  expect(screen.getByRole('heading', { name: /inscription/i })).toBeInTheDocument();
});

test('calls onAuth with mode login, email, password on submit', async () => {
  const onAuth = vi.fn().mockResolvedValue(undefined);
  render(<AuthModal onClose={vi.fn()} onAuth={onAuth} />);

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'pass123' } });
  fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

  await waitFor(() =>
    expect(onAuth).toHaveBeenCalledWith('login', 'test@example.com', 'pass123')
  );
});
