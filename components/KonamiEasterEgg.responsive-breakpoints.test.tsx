import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// Framer Motion Proxy Mock: Allows us to inspect the element props (initial/animate)
// and handles all element tags cleanly.
// ---------------------------------------------------------------------------
vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        const Component = React.forwardRef(
          (
            { children, ...props }: React.HTMLAttributes<HTMLElement> & { [key: string]: unknown },
            ref: React.Ref<HTMLElement>
          ) => {
            const {
              initial,
              animate,
              exit,
              transition,
              whileHover,
              whileTap,
              variants,
              ...domProps
            } = props as Record<string, unknown>;

            return React.createElement(
              tag,
              {
                ...domProps,
                ref,
                'data-testid': `motion-${tag}`,
                'data-initial': initial ? JSON.stringify(initial) : undefined,
                'data-animate': animate ? JSON.stringify(animate) : undefined,
              },
              children
            );
          }
        );
        Component.displayName = `motion.${tag}`;
        return Component;
      },
    }
  );

  const AnimatePresence = ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);
  AnimatePresence.displayName = 'AnimatePresence';

  return { motion, AnimatePresence };
});

import KonamiEasterEgg from './KonamiEasterEgg';

describe('KonamiEasterEgg - Responsive Breakpoints & Mobile Viewports (Variation 7)', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    vi.useFakeTimers();
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();

    // Reset standard window viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    window.dispatchEvent(new Event('resize'));
  });

  const triggerSecretCode = () => {
    const code = 'commit';
    code.split('').forEach((char) => {
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      });
    });
  };

  // -------------------------------------------------------------------------
  // Test Case 1: Mock standard mobile-width media coordinates (e.g. 375px wide viewports)
  // -------------------------------------------------------------------------
  it('1. Mock standard mobile-width media coordinates (375px): Simulates mobile viewport size and renders without crashing', () => {
    // Set viewport dimensions to match iPhone SE width (375px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });
    window.dispatchEvent(new Event('resize'));

    render(<KonamiEasterEgg />);
    triggerSecretCode();

    // Confirm that the screen width is simulated correctly
    expect(window.innerWidth).toBe(375);
    expect(window.innerHeight).toBe(667);

    // Verify the main overlay content mounts and is displayed
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('You Found It!');
  });

  // -------------------------------------------------------------------------
  // Test Case 2: Assert that layout columns reflow into standard vertical flex lists
  // -------------------------------------------------------------------------
  it('2. Assert that layout columns reflow: Matrix rain drops and text lines structure flow vertically to prevent squishing', () => {
    render(<KonamiEasterEgg />);
    triggerSecretCode();

    // Query matrix drop wrapper components
    const matrixDrops = screen
      .getAllByTestId('motion-div')
      .filter((element) => element.className.includes('flex-col'));
    expect(matrixDrops.length).toBeGreaterThan(0);

    // Ensure all matched MatrixDrop columns use flex-col items-center layout to reflow characters vertically
    matrixDrops.forEach((drop) => {
      expect(drop).toHaveClass('flex', 'flex-col', 'items-center');
    });

    // Accent elements check: Accent lines should be stackable separate block/div structures
    const binaryAccent = screen.getByText('010110').parentElement;
    expect(binaryAccent).toBeInTheDocument();

    // Ensure nested children of the accents are rendered as individual block items
    const lines = binaryAccent?.querySelectorAll('div') || [];
    expect(lines.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Test Case 3: Verify styling values are not absolute widths that cause horizontal scrollbars on smaller viewports
  // -------------------------------------------------------------------------
  it('3. Verify styling values prevent absolute-width overflow: Overlays and container boxes use relative constraints', () => {
    // Force mobile viewport constraint
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    const { container } = render(<KonamiEasterEgg />);
    triggerSecretCode();

    // The main viewport overlay wrapper MUST use fixed inset-0 and overflow-hidden to clip scrollbars
    const overlayWrapper = container.querySelector('.fixed');
    expect(overlayWrapper).toBeInTheDocument();
    expect(overlayWrapper).toHaveClass('inset-0', 'overflow-hidden');

    // The inner dialogue box bg container must NOT use absolute pixel widths (e.g. w-[500px])
    const dialogueBox = screen.getByText('You Found It!').closest('div');
    expect(dialogueBox).toBeInTheDocument();

    // Check classes for custom absolute widths like w-[...]px or min-w-[...]px that cause scrollbars on 375px
    expect(dialogueBox?.className).not.toMatch(/w-\[\d+px\]/);
    expect(dialogueBox?.className).not.toMatch(/min-w-\[\d+px\]/);

    // Ensure fluid spacing padding is instead applied
    expect(dialogueBox).toHaveClass('px-10', 'py-8');
  });

  // -------------------------------------------------------------------------
  // Test Case 4: Check that navigation components scale down gracefully
  // -------------------------------------------------------------------------
  it('4. Check that navigation components scale down gracefully: Accent labels and typographic sizes adjust for mobile views', () => {
    render(<KonamiEasterEgg />);
    triggerSecretCode();

    // Verify center text heading and icon elements have responsive Tailwind scaling classes
    const rocketEmoji = screen.getByText('🚀');
    expect(rocketEmoji).toHaveClass('text-5xl', 'sm:text-6xl');

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass('text-2xl', 'sm:text-3xl');

    // Accent panels at the corners (top-left & bottom-right) should use tiny font size 10px and fluid offsets
    const binaryRainAccent = screen.getByText('010110').parentElement;
    expect(binaryRainAccent).toHaveClass('absolute', 'top-4', 'left-4', 'text-[10px]');

    const hexAccent = screen.getByText('0xCAFE').parentElement;
    expect(hexAccent).toHaveClass('absolute', 'bottom-4', 'right-4', 'text-[10px]');
  });

  // -------------------------------------------------------------------------
  // Test Case 5: Assert mobile-specific toggle states respond cleanly
  // -------------------------------------------------------------------------
  it('5. Assert mobile-specific toggle states: Verify typing inside input fields disables the overlay trigger', () => {
    const { container } = render(
      <div>
        <input data-testid="mobile-input" type="text" />
        <KonamiEasterEgg />
      </div>
    );

    const input = screen.getByTestId('mobile-input');
    act(() => {
      input.focus();
    });

    // Simulate keydown event characters typed in the text input field
    'commit'.split('').forEach((char) => {
      act(() => {
        fireEvent.keyDown(input, { key: char });
      });
    });

    // Verify the overlay did not get triggered or shown
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();

    // Verify that once typing occurs outside of input elements on the window, the toggle opens cleanly
    act(() => {
      input.blur();
    });
    triggerSecretCode();

    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
