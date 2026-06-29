import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import Loading from './loading';
import { LOADING_ROOT_CLASSES } from './loadingClasses';

describe('Contributors Loading', () => {
  it('renders loading fallback component', () => {
    render(<Loading />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not render persistent loading copy', () => {
    render(<Loading />);

    expect(screen.queryByText(/loading the collective/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fetching contributor data from github/i)).not.toBeInTheDocument();
  });

  it('contains animated loader elements', () => {
    const { container } = render(<Loading />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('maintains centered flex layout and themed backdrop', () => {
    const { container } = render(<Loading />);

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveClass(...LOADING_ROOT_CLASSES);
  });

  it('renders loader container with accessibility attributes', () => {
    render(<Loading />);

    const status = screen.getByRole('status');

    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-label', 'Loading contributors');
  });
});
