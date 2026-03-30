import { render, screen } from '@testing-library/react';
import FloatingCard from '../FloatingCard';

test('renders children inside the card', () => {
  render(<FloatingCard><span>hello</span></FloatingCard>);
  expect(screen.getByText('hello')).toBeInTheDocument();
});

test('renders the handle bar', () => {
  render(<FloatingCard><span>x</span></FloatingCard>);
  expect(document.querySelector('.float-card-handle')).toBeInTheDocument();
});

test('applies extra className when provided', () => {
  render(<FloatingCard className="my-extra"><span>x</span></FloatingCard>);
  expect(document.querySelector('.my-extra')).toBeInTheDocument();
});
