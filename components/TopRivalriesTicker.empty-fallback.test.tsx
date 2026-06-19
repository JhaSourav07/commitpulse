import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import TopRivalriesTicker from './TopRivalriesTicker';
import '@testing-library/jest-dom/vitest';

// Mock next/navigation to verify router push operations if needed
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

interface MockMotionProps extends React.HTMLAttributes<HTMLDivElement> {
  animate?: unknown;
  transition?: unknown;
}

// Mock framer-motion to render normal div containers and avoid animation complications
vi.mock('framer-motion', () => {
  const mockMotionDivInternal = React.forwardRef<HTMLDivElement, MockMotionProps>(
    ({ children, animate: _animate, transition: _transition, ...props }, ref) => {
      void _animate;
      void _transition;
      return (
        <div ref={ref} {...props}>
          {children}
        </div>
      );
    }
  );
  mockMotionDivInternal.displayName = 'MotionDiv';
  return {
    motion: {
      div: mockMotionDivInternal,
    },
  };
});

describe('components/TopRivalriesTicker - Edge Cases & Empty/Missing Inputs', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('1. renders safely without crashing when provided with an empty array', () => {
    expect(() => render(<TopRivalriesTicker rivalries={[]} />)).not.toThrow();

    // Check that we don't have MOCK_RIVALRIES content rendered (e.g. torvalds)
    expect(screen.queryByText('torvalds')).not.toBeInTheDocument();
  });

  it('2. handles null or undefined rivalries prop gracefully without exceptions', () => {
    // With undefined, should default to MOCK_RIVALRIES
    const { rerender } = render(<TopRivalriesTicker rivalries={undefined} />);
    expect(screen.getAllByText('torvalds').length).toBeGreaterThan(0);

    // With null, should default to empty array or render safely without crashing
    expect(() => rerender(<TopRivalriesTicker rivalries={null} />)).not.toThrow();
    expect(screen.queryByText('torvalds')).not.toBeInTheDocument();
  });

  it('3. verifies the default wrapper structure, classes, and styling remain valid in empty state', () => {
    const { container } = render(<TopRivalriesTicker rivalries={[]} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeInTheDocument();

    // Core styling classes must remain present to guarantee visual consistency
    expect(wrapper.className).toContain('w-full');
    expect(wrapper.className).toContain('overflow-hidden');
    expect(wrapper.className).toContain('py-3');
    expect(wrapper.className).toContain('relative');
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('items-center');

    // Ensure gradient overlay containers are present
    const gradientOverlays = container.querySelectorAll('.pointer-events-none');
    expect(gradientOverlays.length).toBe(2);
  });

  it('4. re-renders multiple times with empty inputs without runtime errors or hydration inconsistencies', () => {
    const { rerender } = render(<TopRivalriesTicker rivalries={[]} />);

    // Check multiple re-renders with various empty/null inputs
    expect(() => {
      rerender(<TopRivalriesTicker rivalries={[]} />);
      rerender(<TopRivalriesTicker rivalries={null} />);
      rerender(<TopRivalriesTicker rivalries={[]} />);
    }).not.toThrow();

    // Ensure fallback message is displayed after multiple re-renders
    expect(screen.getByText('No active rivalries')).toBeInTheDocument();
  });

  it('5. verifies empty placeholder message and presence of root DOM structure in empty state', () => {
    render(<TopRivalriesTicker rivalries={[]} />);

    // Verify the placeholder text exists
    expect(screen.getByText('No active rivalries')).toBeInTheDocument();

    // Ensure key root marquee container remains present
    const marqueeContainer = screen.getByText('No active rivalries').parentElement;
    expect(marqueeContainer).toBeInTheDocument();
    expect(marqueeContainer?.className).toContain('flex');
    expect(marqueeContainer?.className).toContain('whitespace-nowrap');
  });
});
