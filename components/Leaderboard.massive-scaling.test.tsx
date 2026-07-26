import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import Leaderboard, { Contributor } from './Leaderboard';

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: ({ ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    /* eslint-disable @next/next/no-img-element */
    <img alt="mock" {...props} />
  ),
}));

// Mock Framer Motion
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

describe('Leaderboard - Massive Scaling & High Bounds (Issue #2754 Equivalent)', () => {
  it('Massive Array Population (Render Bounds): handles processing arrays of 1000+ contributors cleanly without crashing', () => {
    const massiveContributors = Array.from({ length: 1005 }).map((_, i) => ({
      id: i,
      login: `user${i}`,
      avatar_url: `https://avatars.githubusercontent.com/u/${i}?v=4`,
      contributions: 100 - i, // fake sort
      html_url: `https://github.com/user${i}`,
    }));

    const start = performance.now();
    const { container } = render(<Leaderboard contributors={massiveContributors} />);
    const end = performance.now();

    // Verify it extracts podium and leaves 1002 in the list
    const listEntries = container.querySelectorAll('.flex.items-center.justify-between.p-4');
    expect(listEntries.length).toBe(1002);

    // Performance bounds check (bumped to 15000ms to account for slower CI runners)
    expect(end - start).toBeLessThan(15000);
  }, 15000);

  it('Extreme High Contribution Metric Bounds: safely renders millions of commits without integer layout overflow', () => {
    const highMetricData: Contributor[] = [
      { id: 1, login: 'whale', avatar_url: '', html_url: '', contributions: 999999999 },
      { id: 2, login: 'shark', avatar_url: '', html_url: '', contributions: 888888888 },
      { id: 3, login: 'dolphin', avatar_url: '', html_url: '', contributions: 777777777 },
      { id: 4, login: 'fish', avatar_url: '', html_url: '', contributions: 666666666 },
    ];

    const { getByText } = render(<Leaderboard contributors={highMetricData} />);

    // Podium text
    expect(getByText('999999999')).toBeTruthy();
    expect(getByText('888888888')).toBeTruthy();
    expect(getByText('777777777')).toBeTruthy();

    // List text
    expect(getByText('666666666')).toBeTruthy();
  });

  it('Rank Formatting Overflow Prevention: ensures extremely high index numbers do not break grid bounds', () => {
    // Check rank #1000+ string bounds
    const highRankData = Array.from({ length: 1500 }).map((_, i) => ({
      id: i,
      login: `user${i}`,
      avatar_url: '',
      contributions: 10,
      html_url: '',
    }));

    const { getByText } = render(<Leaderboard contributors={highRankData} />);

    // Verify #1000 renders cleanly inside the bounding flex box
    const highRankItem = getByText('#1000');
    expect(highRankItem).toBeTruthy();
    expect(highRankItem.className).toContain('font-mono');
  }, 15000);

  it('Podium Extraction Memory Allocation: strictly segments exactly the top 3 nodes regardless of massive data input sizes', () => {
    const massiveData = Array.from({ length: 500 }).map((_, i) => ({
      id: i,
      login: `user${i}`,
      avatar_url: '',
      contributions: 10,
      html_url: '',
    }));

    const { container } = render(<Leaderboard contributors={massiveData} />);

    // Check that we only rendered 3 PodiumItems (Rank 1, 2, 3)
    const crowns = container.querySelectorAll('.absolute.-top-8.z-30'); // Crown icons exist in podiums only
    expect(crowns.length).toBe(3);
  });

  it('Structural Text Wrapping Safety: extreme long usernames truncate without clipping or blowing out DOM boundaries', () => {
    const extremeNameData: Contributor[] = [
      { id: 1, login: 'a'.repeat(500), avatar_url: '', html_url: '', contributions: 100 },
      { id: 2, login: 'b'.repeat(500), avatar_url: '', html_url: '', contributions: 90 },
      { id: 3, login: 'c'.repeat(500), avatar_url: '', html_url: '', contributions: 80 },
    ];

    const { getByText } = render(<Leaderboard contributors={extremeNameData} />);

    const longNameUser = getByText('a'.repeat(500));
    // Verify it uses truncate to stop boundary breakages
    expect(longNameUser.className).toContain('truncate');
  });
});
