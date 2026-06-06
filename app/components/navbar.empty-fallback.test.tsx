import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from './navbar';

describe('Navbar - Empty & Missing Input Edge Cases', () => {
  it('renders without crashing when no props are passed', () => {
    render(<Navbar />);
    expect(document.body).toBeInTheDocument();
  });

  it('shows fallback UI when nav items are empty', () => {
    render(<Navbar navItems={[]} />);

    const fallback = screen.getByText(/no items|empty|nothing/i);
    expect(fallback).toBeInTheDocument();
  });

  it('maintains navigation structure even when props are missing', () => {
    render(<Navbar />); // no props at all

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('does not crash when component is rendered in minimal state', () => {
    expect(() => render(<Navbar />)).not.toThrow();
  });

  it('does not produce console errors in empty state', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<Navbar navItems={[]} />);

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
