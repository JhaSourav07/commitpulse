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

describe('BrandParticles Mouse Interactivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders particle layer successfully', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    render(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('renders particles when reduced motion is enabled', async () => {
    mockUseReducedMotion.mockReturnValue(true);

    render(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('maintains non-interactive overlay behavior', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    const { container } = render(<BrandParticles />);

    await screen.findAllByTestId('particle');

    expect(container.querySelector('.pointer-events-none')).toBeTruthy();
  });

  it('renders particles consistently across rerenders', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    const { rerender } = render(<BrandParticles />);

    rerender(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('does not throw during render lifecycle', () => {
    mockUseReducedMotion.mockReturnValue(false);

    expect(() => render(<BrandParticles />)).not.toThrow();
  });
});
