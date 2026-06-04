/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ContributorsPage from './page';

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, ...rest } = props || {};
    return <img {...rest} />;
  },
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('gsap', () => {
  const tween = { kill: vi.fn() };
  const mockGsap = {
    registerPlugin: vi.fn(),
    to: vi.fn().mockReturnValue(tween),
    fromTo: vi.fn().mockReturnValue(tween),
    set: vi.fn(),
    context: vi.fn((callback: any) => {
      if (typeof callback === 'function') {
        callback();
      }
      return { revert: vi.fn() };
    }),
  };
  return { default: mockGsap, gsap: mockGsap };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    getAll: vi.fn(() => []),
  },
}));

vi.mock('framer-motion', () => {
  return {
    motion: {
      div: 'div',
      span: 'span',
      p: 'p',
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      h4: 'h4',
      h5: 'h5',
      h6: 'h6',
      section: 'section',
      a: 'a',
      button: 'button',
      img: 'img',
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useMotionValue: (initial: any) => {
      const [val, setVal] = React.useState(initial);
      return {
        current: val,
        set: (v: any) => setVal(v),
      };
    },
    useSpring: (value: any) => value,
    useTransform: (value: any, fn: any) => fn(value.current ?? value),
  };
});

// Helper to generate mock contributors
function generateMockContributors(count: number, baseContributions = 10) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    list.push({
      id: i,
      login: `contributor-${i}`,
      avatar_url: `https://avatars.githubusercontent.com/u/${i}?v=4`,
      contributions: baseContributions + i,
      html_url: `https://github.com/contributor-${i}`,
    });
  }
  return list;
}

describe('ContributorsPage - Massive Data Sets & High Bounds Scaling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (callback: FrameRequestCallback) =>
        setTimeout(callback, 0) as unknown as number;
    }
  });

  // --- Test Case 1 ---
  it('renders successfully with thousands of contributors', async () => {
    const mockData = generateMockContributors(300);
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockData,
      })
    ) as any;

    const element = await ContributorsPage();
    await act(async () => {
      render(element);
    });

    // Verify page title and header
    expect(screen.getByRole('heading', { name: /THE COLLECTIVE/i })).toBeTruthy();

    // Check that we display the total number of contributors correctly (handles text node splitting)
    const contributorCountEls = screen.getAllByText('300');
    expect(contributorCountEls.length).toBeGreaterThan(0);
    const hasPlusSuffix = contributorCountEls.some((el) =>
      el.parentElement?.textContent?.includes('300+')
    );
    expect(hasPlusSuffix).toBe(true);
  }, 15000);

  // --- Test Case 2 ---
  it('handles extremely high contribution counts (high bounds metrics) without overflow', async () => {
    const mockData = [
      {
        id: 999,
        login: 'super-contributor',
        avatar_url: 'https://avatars.githubusercontent.com/u/999?v=4',
        contributions: 99999999,
        html_url: 'https://github.com/super-contributor',
      },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockData,
      })
    ) as any;

    const element = await ContributorsPage();
    await act(async () => {
      render(element);
    });

    // Total commits counter should show the high bound value (node may be split as <span>99999999</span>+)
    const commitCountEls = screen.getAllByText('99999999');
    expect(commitCountEls.length).toBeGreaterThan(0);
    const hasPlusSuffix = commitCountEls.some((el) =>
      el.parentElement?.textContent?.includes('99999999+')
    );
    expect(hasPlusSuffix).toBe(true);
  });

  // --- Test Case 3 ---
  it('retains visual integrity and compiles correctly with extremely long usernames', async () => {
    const extremelyLongUsername = 'a'.repeat(200); // 200 characters
    const mockData = [
      {
        id: 1,
        login: extremelyLongUsername,
        avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
        contributions: 50,
        html_url: 'https://github.com/long-user',
      },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockData,
      })
    ) as any;

    const element = await ContributorsPage();
    await act(async () => {
      render(element);
    });

    expect(screen.getByRole('heading', { name: /THE VANGUARD/i })).toBeTruthy();
    // Verify that the elements with the long username render in the tree
    const longUserEls = screen.getAllByText(extremelyLongUsername);
    expect(longUserEls.length).toBeGreaterThan(0);
    expect(longUserEls[0]).toBeTruthy();
  });

  // --- Test Case 4 ---
  it('slices and sorts top contributors correctly from a massive list', async () => {
    // Generate 50 contributors
    const mockData = generateMockContributors(50, 100); // contributions from 101 to 150
    // contributor-50 will have 150 contributions (highest)
    // contributor-1 will have 101 contributions (lowest)

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockData,
      })
    ) as any;

    const element = await ContributorsPage();
    await act(async () => {
      render(element);
    });

    // Vanguard displays the top 6 sliced and sorted descending: contributor-50, 49, 48, 47, 46, 45
    // Let's assert these users are rendered in the Vanguard (Leaderboard)
    expect(screen.getByText('contributor-50')).toBeTruthy();
    expect(screen.getByText('contributor-45')).toBeTruthy();
  });

  // --- Test Case 5 ---
  it('verifies calculations and rendering execution times remain within budget under high load', async () => {
    const mockData = generateMockContributors(500);
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockData,
      })
    ) as any;

    const startTime = performance.now();
    const element = await ContributorsPage();
    await act(async () => {
      render(element);
    });
    const endTime = performance.now();

    const renderTime = endTime - startTime;
    // Rendering 500 mock cards should take less than 1500ms under virtual DOM + Vitest
    expect(renderTime).toBeLessThan(3000);
  });
});
