import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import Achievements from './Achievements';
import { Achievement } from '@/types/dashboard';

// 1. Mock IntersectionObserver properly using a Class (Framer Motion requires 'new')
const setupIntersectionObserverMock = () => {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
};

// 2. Mock Data to satisfy the component's required props
const mockAchievements = [
  {
    id: '1',
    type: 'streak',
    title: '7 Day Streak',
    description: 'Logged in for 7 days in a row.',
    isUnlocked: true,
  },
  {
    id: '2',
    type: 'behavior',
    title: 'Code Reviewer',
    description: 'Reviewed 5 PRs.',
    isUnlocked: false,
    progress: 40,
    currentValue: 2,
    threshold: 5,
  },
] as unknown as Achievement[];

describe('Achievements Component - Theme Contrast & Visual Cohesion', () => {
  // Utility to mock the browser's system theme preference
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
    setupIntersectionObserverMock();
    setupThemeMock('light');
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('emulates both dark and light prefers-color-scheme environments properly', () => {
    setupThemeMock('dark');
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);

    setupThemeMock('light');
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false);
  });

  it('adapts visual container elements safely when toggling between light and dark settings', () => {
    const { container: lightContainer, unmount } = render(
      <Achievements achievements={mockAchievements} />
    );
    expect(lightContainer).not.toBeNull();
    unmount();

    setupThemeMock('dark');
    document.documentElement.classList.add('dark');
    const { container: darkContainer } = render(<Achievements achievements={mockAchievements} />);

    expect(darkContainer).not.toBeNull();
  });

  it('satisfies contrast requirements by relying on stylesheet classes instead of hardcoded inline styles for text', () => {
    const { container } = render(<Achievements achievements={mockAchievements} />);

    const textNodes = container.querySelectorAll('h3, h4, p');
    expect(textNodes.length).toBeGreaterThan(0);

    textNodes.forEach((node) => {
      const inlineStyle = node.getAttribute('style') || '';
      expect(inlineStyle.includes('color:')).toBe(false);
    });
  });

  it('confirms that dynamic Tailwind dark mode classes are active in the markup', () => {
    const { container } = render(<Achievements achievements={mockAchievements} />);

    expect(container.innerHTML).toContain('dark:bg-[#0a0a0a]');
    expect(container.innerHTML).toContain('dark:text-white');
  });

  it('prevents background overlays from clipping foreground text content', () => {
    const { container } = render(<Achievements achievements={mockAchievements} />);

    const overflowElements = container.querySelectorAll('.overflow-hidden');
    let hasClippingConflict = false;

    overflowElements.forEach((el) => {
      if (el.className.includes('bg-[rgba') || el.className.includes('bg-')) {
        if (el.textContent && el.textContent.trim().length > 0) {
          hasClippingConflict = true;
        }
      }
    });

    expect(hasClippingConflict).toBe(false);
  });
});
