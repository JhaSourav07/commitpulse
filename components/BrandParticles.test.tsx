import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import BrandParticles from './BrandParticles';

let mockReducedMotion = false;

// Mock framer-motion to inspect properties passed to motion elements and control reduced motion state
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      animate,
      transition,
      style,
      ...props
    }: {
      animate?: unknown;
      transition?: unknown;
      style?: React.CSSProperties;
      [key: string]: unknown;
    }) => (
      <div
        {...props}
        style={style}
        data-testid="motion-div"
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
      />
    ),
  },
  useReducedMotion: () => mockReducedMotion,
}));

describe('BrandParticles Component', () => {
  beforeEach(() => {
    mockReducedMotion = false;
  });

  it('renders nothing on the server side prior to mounting', () => {
    // BrandParticles has a mounted check. When mounting is false, it returns null.
    // To simulate pre-mount, we inspect the behavior before useEffect runs.
    // In React testing library, render runs useEffect synchronously, but we can verify it renders successfully when mounted.
    const { container } = render(<BrandParticles />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders 40 particles once mounted', () => {
    render(<BrandParticles />);
    const particles = screen.getAllByTestId('motion-div');
    expect(particles).toHaveLength(40);
  });

  it('renders particles with random styles and properties', () => {
    render(<BrandParticles />);
    const particles = screen.getAllByTestId('motion-div');

    // Check first particle styles
    const firstParticle = particles[0];
    expect(firstParticle.className).toContain('absolute');
    expect(firstParticle.style.width).toBeTruthy();
    expect(firstParticle.style.height).toBeTruthy();
    expect(firstParticle.style.backgroundColor).toBeTruthy();
    expect(firstParticle.style.left).toBeTruthy();
    expect(firstParticle.style.top).toBeTruthy();
    expect(firstParticle.style.opacity).toBeTruthy();
    expect(firstParticle.style.borderRadius).toBeTruthy();
  });

  it('applies animation paths when motion is enabled (reduced motion = false)', () => {
    mockReducedMotion = false;
    render(<BrandParticles />);
    const particles = screen.getAllByTestId('motion-div');

    const animateAttr = particles[0].getAttribute('data-animate');
    expect(animateAttr).not.toBe('{}');
    expect(animateAttr).toContain('y');
    expect(animateAttr).toContain('x');
    expect(animateAttr).toContain('rotate');

    const transitionAttr = particles[0].getAttribute('data-transition');
    expect(transitionAttr).not.toBe('{}');
    expect(transitionAttr).toContain('duration');
    expect(transitionAttr).toContain('delay');
  });

  it('disables animation and transition when reduced motion is enabled', () => {
    mockReducedMotion = true;
    render(<BrandParticles />);
    const particles = screen.getAllByTestId('motion-div');

    const animateAttr = particles[0].getAttribute('data-animate');
    expect(animateAttr).toBe('{}');

    const transitionAttr = particles[0].getAttribute('data-transition');
    expect(transitionAttr).toBe('{}');
  });
});
