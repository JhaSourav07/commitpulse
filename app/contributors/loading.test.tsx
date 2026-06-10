import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import Loading from './loading';

describe('Contributors Loading', () => {
  it('renders loading fallback component', () => {
    render(<Loading />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders loading messages correctly', () => {
    render(<Loading />);

    expect(screen.getByText(/loading the collective/i)).toBeInTheDocument();

    expect(screen.getByText(/fetching contributor data from github/i)).toBeInTheDocument();
  });

  it('contains animated loader elements', () => {
    const { container } = render(<Loading />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('maintains centered flex layout and themed backdrop', () => {
    const { container } = render(<Loading />);

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('min-h-screen');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
    expect(wrapper).toHaveClass('bg-[#050505]');
  });

  it('renders loader container with accessibility attributes', () => {
    render(<Loading />);

    const status = screen.getByRole('status');

    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});
