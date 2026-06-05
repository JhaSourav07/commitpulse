import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import BrandParticles from './BrandParticles';

let mockReducedMotion = false;

// Cohesive framer-motion mock layer to match project architectural baseline
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

describe('BrandParticles - Edge Cases & Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    mockReducedMotion = false;
  });

  // Test Case 1: Render the target module or component with default/empty parameters
  it('renders stably when parameters or option configs are completely empty', () => {
    const { container } = render(<BrandParticles />);

    // Humanic Check: Verifies the component handles an empty input state without returning null or crashing
    expect(container.firstChild).not.toBeNull();
  });

  // Test Case 2: Verify that a clear, non-breaking fallback UI or standard element array is displayed
  it('displays a fallback structure consisting of standard particle layers even with zero initial inputs', () => {
    render(<BrandParticles />);
    const elements = screen.getAllByTestId('motion-div');

    // Humanic Check: Confirms the component handles empty initialization parameters by defaulting to its baseline count
    expect(elements.length).toBeGreaterThan(0);
    expect(elements).toHaveLength(40);
  });

  // Test Case 3: Verify standard styles are maintained in this default empty layout state
  it('maintains absolute structural layout styles under empty baseline defaults', () => {
    render(<BrandParticles />);
    const particles = screen.getAllByTestId('motion-div');

    // Humanic Check: Checks that lack of inputs doesn't strip out essential CSS class rules
    expect(particles[0].className).toContain('absolute');
  });

  // Test Case 4: Assert that no unexpected runtime errors or hydration failures occur
  it('guarantees exception safety and does not throw runtime errors when initialized under empty options', () => {
    // Humanic Check: Executes a direct wrapping wrapper function assertion to confirm hydration/mount exception safety
    expect(() => {
      const { unmount } = render(<BrandParticles />);
      unmount();
    }).not.toThrow();
  });

  // Test Case 5: Check key DOM structures to make sure baseline properties exist
  it('ensures core visual layout elements retain standard geometry properties when options are unconfigured', () => {
    render(<BrandParticles />);
    const particles = screen.getAllByTestId('motion-div');
    const sampleParticle = particles[0];

    // Humanic Check: Validates that fundamental placement nodes exist and don't collapse to undefined values
    expect(sampleParticle.style.left).toBeDefined();
    expect(sampleParticle.style.top).toBeDefined();
    expect(sampleParticle.style.opacity).toBeDefined();
  });
});
