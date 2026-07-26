import { describe, expect, it, vi, beforeEach } from 'vitest';
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

describe('BrandParticles Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing after hydration', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    render(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('renders successfully when reduced motion is enabled', async () => {
    mockUseReducedMotion.mockReturnValue(true);

    render(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('maintains particle rendering stability across re-renders', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    const { rerender } = render(<BrandParticles />);

    rerender(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('renders particle container even when animation is disabled', async () => {
    mockUseReducedMotion.mockReturnValue(true);

    const { container } = render(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(container).toBeTruthy();
    expect(particles.length).toBeGreaterThan(0);
  });

  it('does not throw during normal component lifecycle', () => {
    mockUseReducedMotion.mockReturnValue(false);

    expect(() => render(<BrandParticles />)).not.toThrow();
  });
});
