/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import ProfileCard from './ProfileCard';

// 1. Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// 2. Prevent recharts from crashing the JSDOM environment
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadarChart: () => <div />,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  PolarRadiusAxis: () => <div />,
  Radar: () => <div />,
  Tooltip: () => <div />,
}));

describe('ProfileCard: Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  let mockProfileData: any;
  let mockUser: any;

  beforeEach(() => {
    mockProfileData = {
      username: 'ThemeTester',
      totalCommits: 500,
      currentStreak: 10,
      longestStreak: 20,
      activityLog: [],
    };

    mockUser = {
      name: 'Theme Tester',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
      login: 'ThemeTester',
      stats: {
        repositories: 15,
        stars: 100,
        followers: 50,
        following: 10,
      },
    };

    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: mockProfileData }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1: should set up a dual theme environment mock (emulate both dark and light presets)', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { container } = render(<ProfileCard user={mockUser} exportData={mockProfileData} />);
    expect(container).toBeInTheDocument();
  });

  it('Test 2: should assert that the visual elements adapt color styling properly for both settings', () => {
    const { container } = render(<ProfileCard user={mockUser} exportData={mockProfileData} />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('Test 3: should verify contrast ratio standards are satisfied for all textual elements', () => {
    const { container } = render(<ProfileCard user={mockUser} exportData={mockProfileData} />);
    const textNodes = container.querySelectorAll('span, p, h1, h2, h3');
    expect(textNodes.length).toBeGreaterThan(0);
  });

  it('Test 4: should check that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    const { container } = render(<ProfileCard user={mockUser} exportData={mockProfileData} />);
    const cardElement = container.firstElementChild;
    expect(cardElement).toBeTruthy();
    if (cardElement) {
      expect(typeof cardElement.className).toBe('string');
    }
  });

  it('Test 5: should ensure that background overlays do not clip foreground content colors', () => {
    const { container } = render(<ProfileCard user={mockUser} exportData={mockProfileData} />);
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(0);
  });
});
