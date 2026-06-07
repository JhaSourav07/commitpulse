import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import Leaderboard, { Contributor } from './Leaderboard';

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt="mock" {...props} />,
}));

// Mock framer-motion strictly
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({
        children,
        className,
        onClick,
        style,
      }: {
        children?: React.ReactNode;
        className?: string;
        onClick?: React.MouseEventHandler<HTMLDivElement>;
        style?: React.CSSProperties;
      }) => (
        <div className={className} onClick={onClick} style={style} data-testid="motion-div">
          {children}
        </div>
      ),
    },
  };
});

// IntersectionObserver mock
beforeEach(() => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver =
    mockIntersectionObserver as unknown as typeof window.IntersectionObserver;
});

describe('Leaderboard - Responsive Breakpoints & Mobile Layouts (Issue #2759 Equivalent)', () => {
  const mockData: Contributor[] = [
    { id: 1, login: 'gold_user', avatar_url: '', html_url: '', contributions: 100 },
    { id: 2, login: 'silver_user', avatar_url: '', html_url: '', contributions: 90 },
    { id: 3, login: 'bronze_user', avatar_url: '', html_url: '', contributions: 80 },
    { id: 4, login: 'fourth_user', avatar_url: '', html_url: '', contributions: 70 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Mobile Viewport Mock Coordinates (Viewport Coordinates Equivalent): simulates a 375px window size without crashing', () => {
    // Mock mobile viewport width
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    window.dispatchEvent(new Event('resize'));

    const { container } = render(<Leaderboard contributors={mockData} />);
    expect(container).toBeTruthy();
  });

  it('Mobile Padding Zones (Horizontal Scrollbars Equivalent): restricts absolute widths by using fluid responsive paddings', () => {
    const { container } = render(<Leaderboard contributors={mockData} />);
    const mainWrapper = container.firstChild as HTMLElement;

    // Verify presence of fluid responsive padding classes rather than fixed widths
    expect(mainWrapper.className).toContain('p-8');
    expect(mainWrapper.className).toContain('sm:p-12');
    expect(mainWrapper.className).toContain('w-full'); // Ensures it never forces a horizontal scrollbar
  });

  it('Mobile Column Reflows (Vertical Flex Lists Equivalent): ensures podium items scale down gracefully to fit mobile columns', () => {
    const { container } = render(<Leaderboard contributors={mockData} />);

    // Podium wrapper responsiveness
    const podiumWrapper = container.querySelector('.h-\\[300px\\].sm\\:h-\\[360px\\]');
    expect(podiumWrapper).toBeTruthy();

    // Individual podium item responsiveness
    const podiumItems = container.querySelectorAll('.w-28.sm\\:w-36');
    expect(podiumItems.length).toBe(3); // Top 3 podium items
  });

  it('Mobile-Specific Toggles (Toggle States Equivalent): hides non-essential labels like "commits" on small screens', () => {
    const { container } = render(<Leaderboard contributors={mockData} />);

    const listEntries = container.querySelectorAll('.hidden.sm\\:inline');
    expect(listEntries.length).toBeGreaterThan(0);

    // Check that the text "commits" is targeted for hiding
    expect(listEntries[0].textContent).toBe('commits');
  });

  it('Mobile Touch Target Scaling (Navigation Scaling Equivalent): preserves large click zones for touch devices even on mobile', () => {
    const openMock = vi.fn();
    const originalOpen = window.open;
    window.open = openMock;

    const { container } = render(<Leaderboard contributors={mockData} />);

    // Grab a list item
    const listItem = container.querySelector('.flex.items-center.justify-between.p-4');
    expect(listItem).toBeTruthy(); // Large padding `p-4` maintained for touch targets

    fireEvent.click(listItem as Element);

    // Verify click opens contributor's GitHub profile in a new tab
    expect(openMock).toHaveBeenCalledWith('', '_blank', 'noopener,noreferrer');

    window.open = originalOpen;
  });
});
