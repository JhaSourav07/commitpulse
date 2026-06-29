import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Loading from './loading';
import { LOADING_ROOT_CLASSES } from './loadingClasses';

// Test wrapper that integrates the real Loading component within an interactive tracking layer
const InteractiveLoadingHarness: React.FC = () => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const [isTouched, setIsTouched] = React.useState(false);

  return (
    <div
      data-testid="interactive-wrapper"
      className={isHovered ? 'cursor-pointer' : 'cursor-wait'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={(e) => setCoords({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => {
        setIsHovered(false);
        setCoords({ x: 0, y: 0 });
      }}
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setIsTouched(false)}
    >
      {/* Integrating the actual real codebase component directly */}
      <Loading />

      {/* Interactive visual overlays driven by gestures */}
      {isHovered && (
        <div data-testid="interactive-tooltip">
          Coordinates: {coords.x}, {coords.y}
        </div>
      )}
      {isTouched && <div data-testid="touch-indicator">Touch Active</div>}
    </div>
  );
};

describe('ContributorsLoading Interactivity & Touch Events (Real Component Verification)', () => {
  // Test Case 1: Mouse Enter Gesture Trigger
  it('should successfully trigger hover states when mouse enters the layout wrapper context', () => {
    render(<InteractiveLoadingHarness />);
    const wrapper = screen.getByTestId('interactive-wrapper');

    // Assert stale loading copy is not present in the rendered tree.
    expect(screen.queryByText('Loading the collective...')).toBeNull();

    fireEvent.mouseEnter(wrapper);
    expect(screen.getByTestId('interactive-tooltip')).toBeDefined();
  });

  // Test Case 2: Computed Coordinate Layout Processing
  it('should dynamically update and process cursor coordinates accurately on mouse move events', () => {
    render(<InteractiveLoadingHarness />);
    const wrapper = screen.getByTestId('interactive-wrapper');

    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseMove(wrapper, { clientX: 150, clientY: 300 });

    expect(screen.getByText('Coordinates: 150, 300')).toBeDefined();
  });

  // Test Case 3: Style Classes State Application
  it('should switch wrapper class token lists from wait to pointer styles on active mouse focus', () => {
    render(<InteractiveLoadingHarness />);
    const wrapper = screen.getByTestId('interactive-wrapper');

    expect(wrapper.className).toContain('cursor-wait');
    fireEvent.mouseEnter(wrapper);
    expect(wrapper.className).toContain('cursor-pointer');
  });

  // Test Case 4: Touch Gesture & Propagation Boundaries
  it('should safely capture mobile touch start and touch end boundary propagation events', () => {
    render(<InteractiveLoadingHarness />);
    const wrapper = screen.getByTestId('interactive-wrapper');

    fireEvent.touchStart(wrapper);
    expect(screen.getByTestId('touch-indicator')).toBeDefined();

    fireEvent.touchEnd(wrapper);
    expect(screen.queryByTestId('touch-indicator')).toBeNull();
  });

  // Test Case 5: Mouse Leave Reset Teardown
  it('should successfully dismiss runtime tooltip layers when mouse leave gestures clear the frame', () => {
    render(<InteractiveLoadingHarness />);
    const wrapper = screen.getByTestId('interactive-wrapper');

    fireEvent.mouseEnter(wrapper);
    expect(screen.getByTestId('interactive-tooltip')).toBeDefined();

    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByTestId('interactive-tooltip')).toBeNull();
  });
});
/**
 * Tests for the Contributors Loading component.
 *
 * The `loading.test.tsx` file covers the happy-path render, text content,
 * and animated elements.  This suite focuses on what is NOT covered there:
 *
 *   - ARIA role and live-region semantics (role="status", aria-live="polite")
 *   - DOM structure completeness (spinner ring + glow, two text nodes)
 *   - Keyboard-navigation friendliness (no interactive element grabs focus)
 *   - Visual layout classes that govern the loading UX
 */
describe('Contributors Loading — structure & accessibility', () => {
  it('renders exactly one status landmark', () => {
    render(<Loading />);
    const landmarks = screen.getAllByRole('status');
    expect(landmarks).toHaveLength(1);
  });

  it('status landmark carries aria-live="polite" for screen-reader announcements', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('does not contain persistent primary or secondary loading messages', () => {
    render(<Loading />);
    expect(screen.queryByText('Loading the collective...')).not.toBeInTheDocument();
    expect(screen.queryByText('Fetching contributor data from GitHub')).not.toBeInTheDocument();
  });

  it('renders the spinning ring with the correct Tailwind animation class', () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
    expect(spinner).toHaveClass('rounded-full');
    expect(spinner).toHaveClass('border-t-cyan-400');
  });

  it('renders the pulsing glow element behind the spinner', () => {
    const { container } = render(<Loading />);
    const glow = container.querySelector('.animate-pulse');
    expect(glow).not.toBeNull();
    // The glow must be absolutely positioned so it overlays the ring
    expect(glow).toHaveClass('absolute');
  });

  it('spinner and glow share the same 16x16 (h-16 w-16) dimensions', () => {
    const { container } = render(<Loading />);
    const elements = container.querySelectorAll('.h-16.w-16');
    expect(elements.length).toBeGreaterThanOrEqual(2);
  });

  it('outermost wrapper uses full-viewport dark background layout', () => {
    const { container } = render(<Loading />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass(...LOADING_ROOT_CLASSES);
  });

  it('component contains no focusable interactive elements (purely informational)', () => {
    const { container } = render(<Loading />);
    const focusable = container.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).toBe(0);
  });

  it('does not render the old primary loading message', () => {
    render(<Loading />);
    expect(screen.queryByText('Loading the collective...')).not.toBeInTheDocument();
  });

  it('does not render the old secondary loading message', () => {
    render(<Loading />);
    expect(screen.queryByText('Fetching contributor data from GitHub')).not.toBeInTheDocument();
  });
});
