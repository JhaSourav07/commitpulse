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

describe('BrandParticles Mock Integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully with mocked motion services', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    render(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('renders successfully when reduced-motion integration is enabled', async () => {
    mockUseReducedMotion.mockReturnValue(true);

    render(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('maintains rendering stability across rerenders', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    const { rerender } = render(<BrandParticles />);

    rerender(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('renders overlay container successfully with mocked dependencies', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    const { container } = render(<BrandParticles />);

    await screen.findAllByTestId('particle');

    expect(container.firstChild).toBeTruthy();
  });

  it('does not throw during mocked integration lifecycle execution', () => {
    mockUseReducedMotion.mockReturnValue(false);

    expect(() => render(<BrandParticles />)).not.toThrow();
  });
});
