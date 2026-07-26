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

describe('BrandParticles Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders decorative particle elements successfully', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    render(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('maintains non-interactive accessibility behavior', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    const { container } = render(<BrandParticles />);

    await screen.findAllByTestId('particle');

    expect(container.querySelector('.pointer-events-none')).toBeTruthy();
  });

  it('does not expose focusable button elements', async () => {
    mockUseReducedMotion.mockReturnValue(false);

    render(<BrandParticles />);

    await screen.findAllByTestId('particle');

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders successfully when reduced motion is enabled', async () => {
    mockUseReducedMotion.mockReturnValue(true);

    render(<BrandParticles />);

    const particles = await screen.findAllByTestId('particle');

    expect(particles.length).toBeGreaterThan(0);
  });

  it('does not throw during accessibility-oriented rendering', () => {
    mockUseReducedMotion.mockReturnValue(false);

    expect(() => render(<BrandParticles />)).not.toThrow();
  });
});
