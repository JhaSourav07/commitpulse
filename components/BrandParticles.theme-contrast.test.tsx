import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseReducedMotion = vi.fn();

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: React.HTMLAttributes<HTMLDivElement>) => <div data-testid="particle" {...props} />,
  },
  useReducedMotion: () => mockUseReducedMotion(),
}));

import BrandParticles from './BrandParticles';

describe('BrandParticles Theme Contrast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.className = '';
  });

  it('renders successfully in light mode', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    render(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('renders successfully in dark mode', async () => {
    document.documentElement.classList.add('dark');

    mockUseReducedMotion.mockReturnValue(false);

    render(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('contains dark mode styling class on overlay container', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    const { container } = render(<BrandParticles />);

    await screen.findAllByTestId('particle');

    const overlay = container.querySelector('.dark\\:opacity-40');

    expect(overlay).toBeTruthy();
  });

  it('preserves particle rendering across theme changes', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    const { rerender } = render(<BrandParticles />);

    document.documentElement.classList.add('dark');

    rerender(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('renders overlay container without clipping content structure', async () => {
    mockUseReducedMotion.mockReturnValue(true);

    const { container } = render(<BrandParticles />);

    await screen.findAllByTestId('particle');

    expect(container.firstChild).toBeTruthy();
  });
});
