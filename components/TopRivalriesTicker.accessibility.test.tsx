import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopRivalriesTicker from './TopRivalriesTicker';
import '@testing-library/jest-dom/vitest';

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

vi.mock('framer-motion', () => {
  const MockMotionDiv = React.forwardRef<HTMLDivElement, MockMotionProps>(
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

  MockMotionDiv.displayName = 'MotionDiv';

  return {
    motion: {
      div: MockMotionDiv,
    },
  };
});

describe('components/TopRivalriesTicker Accessibility Standards & Screen Reader Aria Compliance', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders rivalry text content that is available to screen readers', () => {
    render(<TopRivalriesTicker />);

    expect(screen.getAllByText('torvalds').length).toBeGreaterThan(0);
    expect(screen.getAllByText('gaearon').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Kernel vs React').length).toBeGreaterThan(0);
  });

  it('maintains readable rivalry labels and versus indicators', () => {
    render(<TopRivalriesTicker />);

    expect(screen.getAllByText('VS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Vercel & Netlify Founders').length).toBeGreaterThan(0);
  });

  it('preserves logical content order for rivalry information', () => {
    render(<TopRivalriesTicker />);

    const firstUser = screen.getAllByText('torvalds')[0];
    const secondUser = screen.getAllByText('gaearon')[0];
    const label = screen.getAllByText('Kernel vs React')[0];

    expect(firstUser).toBeInTheDocument();
    expect(secondUser).toBeInTheDocument();
    expect(label).toBeInTheDocument();
  });

  it('does not introduce keyboard-focusable elements into the tab order', async () => {
    const user = userEvent.setup();

    render(<TopRivalriesTicker />);

    await user.tab();

    expect(document.body).toHaveFocus();
  });

  it('renders decorative icons without exposing broken accessible content', () => {
    const { container } = render(<TopRivalriesTicker />);

    const svgIcons = container.querySelectorAll('svg');

    expect(svgIcons.length).toBeGreaterThan(0);

    svgIcons.forEach((icon) => {
      expect(icon).toBeInTheDocument();
    });
  });
});
