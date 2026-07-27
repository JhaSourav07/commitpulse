import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).not.toBeNull();
  });

  it('exposes a live status region for assistive technology', () => {
    render(<Spinner label="Loading data" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('uses the label as the accessible name', () => {
    render(<Spinner label="Loading PR insights" />);
    expect(screen.getByRole('status', { name: /loading pr insights/i })).toBeInTheDocument();
  });

  it('defaults to a "Loading" label when none is provided', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders the label visibly by default', () => {
    render(<Spinner label="Fetching stuff" />);
    const label = screen.getByText('Fetching stuff');
    expect(label).toBeInTheDocument();
    expect(label).not.toHaveClass('sr-only');
  });

  it('hides the label visually but keeps it announced when showLabel is false', () => {
    render(<Spinner label="Fetching stuff" showLabel={false} />);
    const label = screen.getByText('Fetching stuff');
    expect(label).toHaveClass('sr-only');
    // Still discoverable by accessible name.
    expect(screen.getByRole('status', { name: /fetching stuff/i })).toBeInTheDocument();
  });

  it('applies a spinning animation to the icon', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('respects a custom icon size', () => {
    const { container } = render(<Spinner size={16} />);
    const icon = container.querySelector('svg');
    expect(icon).toHaveStyle({ width: '16px', height: '16px' });
  });

  it('forwards custom container and icon classes', () => {
    const { container } = render(<Spinner className="my-container" iconClassName="text-red-500" />);
    expect(screen.getByRole('status')).toHaveClass('my-container');
    expect(container.querySelector('svg')).toHaveClass('text-red-500');
  });
});
