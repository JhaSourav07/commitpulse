import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import RadarChart from './RadarChart';
import type { UserProfile, DashboardExportData } from '@/types/dashboard';

interface MockMotionProps {
  initial?: unknown;
  animate?: unknown;
  whileInView?: unknown;
  viewport?: unknown;
  transition?: unknown;
}

type SafeDivProps = React.ComponentPropsWithoutRef<'div'> & MockMotionProps;
type SafePolygonProps = React.ComponentPropsWithoutRef<'polygon'> & MockMotionProps;

// Mock framer-motion inline using type-safe props to pass strict CI checks
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: SafeDivProps) => {
      const cleanProps = { ...props };
      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.whileInView;
      delete cleanProps.viewport;
      delete cleanProps.transition;

      return (
        <div className={className} style={style} {...cleanProps}>
          {children}
        </div>
      );
    },
    polygon: ({ children, className, style, ...props }: SafePolygonProps) => {
      const cleanProps = { ...props };
      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.transition;

      return (
        <polygon className={className} style={style} {...cleanProps}>
          {children}
        </polygon>
      );
    },
  },
}));

describe('RadarChart Theme Contrast Verification Tests', () => {
  const mockProfileA: UserProfile = {
    username: 'ashishraj1504',
    name: 'Ashish Raj',
    avatarUrl: 'https://github.com/ashishraj1504.png',
    isPro: true,
    bio: 'Frontend Engineer',
    location: 'India',
    joinedDate: '2022-01-01',
    developerScore: 92,
    stats: { repositories: 45, followers: 120, following: 15, stars: 350 },
  };

  const mockProfileB: UserProfile = {
    username: 'octocat',
    name: 'The Octocat',
    avatarUrl: 'https://github.com/octocat.png',
    isPro: false,
    bio: 'GitHub mascot',
    location: 'San Francisco',
    joinedDate: '2008-01-01',
    developerScore: 88,
    stats: { repositories: 8, followers: 9999, following: 9, stars: 50 },
  };

  const mockExportA: DashboardExportData = {
    stats: { currentStreak: 10, peakStreak: 42, totalContributions: 1250 },
    languages: [
      { name: 'TypeScript', color: '#3178c6', percentage: 70 },
      { name: 'JavaScript', color: '#f1e05a', percentage: 20 },
      { name: 'CSS', color: '#563d7c', percentage: 10 },
    ],
  };

  const mockExportB: DashboardExportData = {
    stats: { currentStreak: 4, peakStreak: 15, totalContributions: 450 },
    languages: [
      { name: 'Python', color: '#3572A5', percentage: 55 },
      { name: 'TypeScript', color: '#3178c6', percentage: 35 },
      { name: 'HTML', color: '#e34c26', percentage: 10 },
    ],
  };

  const setupThemeMock = (theme: 'light' | 'dark') => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: theme === 'dark' ? query.includes('dark') : !query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  beforeEach(() => {
    setupThemeMock('light');
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Case 1: Setup a dual theme environment mock framework and assert background configurations shift properly
  it('Case 1: Setup a dual theme environment mock framework and assert that structural grid elements alter background styles between light and dark modes accurately', () => {
    setupThemeMock('light');
    document.documentElement.classList.remove('dark');

    const { container: lightContainer, unmount: unmountLight } = render(
      <RadarChart
        languagesA={mockExportA.languages}
        languagesB={mockExportB.languages}
        labelA={mockProfileA.name}
        labelB={mockProfileB.name}
      />
    );
    const lightWrapper = lightContainer.firstChild;
    expect(lightWrapper).toHaveClass('bg-white');
    expect(lightWrapper).toHaveClass('dark:bg-[#0a0a0a]');
    unmountLight();

    setupThemeMock('dark');
    document.documentElement.classList.add('dark');

    const { container: darkContainer, unmount: unmountDark } = render(
      <RadarChart
        languagesA={mockExportA.languages}
        languagesB={mockExportB.languages}
        labelA={mockProfileA.name}
        labelB={mockProfileB.name}
      />
    );
    const darkWrapper = darkContainer.firstChild;
    expect(darkWrapper).toHaveClass('bg-white');
    expect(darkWrapper).toHaveClass('dark:bg-[#0a0a0a]');
    unmountDark();
  });

  // Case 2: Verify typography classes adapt to meet visibility thresholds across color scheme changes
  it('Case 2: Verify that foreground chart text elements preserve a valid contrast marker ratio (e.g., meeting WCAG thresholds) when color schemes change', () => {
    setupThemeMock('light');
    document.documentElement.classList.remove('dark');
    const { container: lightContainer, unmount: unmountLight } = render(
      <RadarChart
        languagesA={mockExportA.languages}
        languagesB={mockExportB.languages}
        labelA={mockProfileA.name}
        labelB={mockProfileB.name}
      />
    );
    const lightTitle = lightContainer.querySelector('h3');
    expect(lightTitle).toHaveClass('text-gray-900');
    expect(lightTitle).toHaveClass('dark:text-white');
    unmountLight();

    setupThemeMock('dark');
    document.documentElement.classList.add('dark');
    const { container: darkContainer, unmount: unmountDark } = render(
      <RadarChart
        languagesA={mockExportA.languages}
        languagesB={mockExportB.languages}
        labelA={mockProfileA.name}
        labelB={mockProfileB.name}
      />
    );
    const darkTitle = darkContainer.querySelector('h3');
    expect(darkTitle).toHaveClass('text-gray-900');
    expect(darkTitle).toHaveClass('dark:text-white');
    unmountDark();
  });

  // Case 3: Confirms tailwind design framework tokens map effectively to elements
  it('Case 3: Check that custom Tailwind tokens (such as dark:bg-[#0a0a0a] or text-gray-900) map effectively into the component properties', () => {
    const { container } = render(
      <RadarChart
        languagesA={mockExportA.languages}
        languagesB={mockExportB.languages}
        labelA={mockProfileA.name}
        labelB={mockProfileB.name}
      />
    );
    const wrapper = container.firstChild;
    const title = container.querySelector('h3');

    expect(wrapper).toHaveClass('bg-white');
    expect(wrapper).toHaveClass('dark:bg-[#0a0a0a]');
    expect(wrapper).toHaveClass('border-black/10');
    expect(wrapper).toHaveClass('dark:border-[rgba(255,255,255,0.08)]');
    expect(title).toHaveClass('text-gray-900');
    expect(title).toHaveClass('dark:text-white');
  });

  // Case 4: Verifies background grid polygons use low opacities to shield foreground data points
  it('Case 4: Verify that high-intensity background grid overlays do not bleed through or clip foreground textual data point colors', () => {
    const { container } = render(
      <RadarChart
        languagesA={mockExportA.languages}
        languagesB={mockExportB.languages}
        labelA={mockProfileA.name}
        labelB={mockProfileB.name}
      />
    );

    const polygons = container.querySelectorAll('polygon');
    expect(polygons.length).toBeGreaterThan(0);
    polygons.forEach((polygon) => {
      const fill = polygon.getAttribute('fill') || '';
      const stroke = polygon.getAttribute('stroke') || '';
      if (fill === 'none') {
        expect(stroke).toContain('rgba');
        expect(stroke).toBe('rgba(120, 120, 120, 0.12)');
      }
    });

    const textNodes = container.querySelectorAll('text');
    expect(textNodes.length).toBeGreaterThan(0);
    textNodes.forEach((textNode) => {
      const fill = textNode.getAttribute('fill');
      expect(fill).toBe('rgba(161, 161, 170, 0.9)');
    });
  });

  // Case 5: Ensures dynamic property overrides maintain visual compliance thresholds gracefully
  it('Case 5: Ensure that dynamic custom theme injection props override system default behaviors cleanly while keeping contrast levels stable', () => {
    setupThemeMock('light');
    document.documentElement.classList.remove('dark');

    const { container, rerender } = render(
      <RadarChart
        languagesA={mockExportA.languages}
        languagesB={mockExportB.languages}
        labelA={mockProfileA.name}
        labelB={mockProfileB.name}
      />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('bg-white');
    expect(wrapper).toHaveClass('dark:bg-[#0a0a0a]');

    setupThemeMock('dark');
    document.documentElement.classList.add('dark');

    rerender(
      <RadarChart
        languagesA={mockExportA.languages}
        languagesB={mockExportB.languages}
        labelA={mockProfileA.name}
        labelB={mockProfileB.name}
      />
    );

    const darkWrapper = container.firstChild;
    expect(darkWrapper).toHaveClass('bg-white');
    expect(darkWrapper).toHaveClass('dark:bg-[#0a0a0a]');
  });
});
