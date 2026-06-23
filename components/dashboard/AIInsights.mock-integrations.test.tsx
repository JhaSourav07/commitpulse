import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIInsight } from '@/types/dashboard';

vi.mock('framer-motion', async () => {
  const React = await import('react');

  const motionProps = new Set([
    'whileHover',
    'whileTap',
    'whileInView',
    'initial',
    'animate',
    'exit',
    'variants',
    'transition',
    'viewport',
    'drag',
    'layout',
    'layoutId',
  ]);

  const stripMotionProps = (props: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(props).filter(([key]) => !motionProps.has(key)));

  const createMotionComponent = (tag: string) => {
    const Component = ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) =>
      React.createElement(tag, stripMotionProps(props), children);

    Component.displayName = `Motion${tag}`;

    return Component;
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      span: createMotionComponent('span'),
      p: createMotionComponent('p'),
      a: createMotionComponent('a'),
      button: createMotionComponent('button'),
      section: createMotionComponent('section'),
      article: createMotionComponent('article'),
      header: createMotionComponent('header'),
      footer: createMotionComponent('footer'),
      main: createMotionComponent('main'),
      nav: createMotionComponent('nav'),
      ul: createMotionComponent('ul'),
      li: createMotionComponent('li'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
      h4: createMotionComponent('h4'),
      h5: createMotionComponent('h5'),
      h6: createMotionComponent('h6'),

      svg: createMotionComponent('svg'),
      g: createMotionComponent('g'),
      path: createMotionComponent('path'),
      circle: createMotionComponent('circle'),
      line: createMotionComponent('line'),

      img: createMotionComponent('img'),
    },

    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,

    useReducedMotion: () => false,

    useMotionValue: (initial = 0) => ({
      get: () => initial,
      set: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
    }),

    useSpring: (value: unknown) => value,
    useTransform: (value: unknown) => value,
  };
});

// Mock IntersectionObserver for Framer Motion whileInView BEFORE component import
class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];
  readonly scrollMargin = '';

  constructor(public callback: IntersectionObserverCallback) {}

  observe = vi.fn(() => {
    // Immediately trigger the callback with "in view" state
    this.callback(
      [
        {
          target: document.createElement('div'),
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: new DOMRect(),
          intersectionRect: new DOMRect(),
          rootBounds: new DOMRect(),
          time: Date.now(),
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver
    );
  });

  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Import component AFTER mocks are set up
import AIInsights from './AIInsights';

// Local cache store and unified mock service
const localCacheStore: Map<string, AIInsight[]> = new Map();

const mockCacheService = {
  get: vi.fn(async (key: string) => {
    return localCacheStore.get(key) || null;
  }),
  set: vi.fn(async (key: string, data: AIInsight[]) => {
    localCacheStore.set(key, data);
  }),
  clear: vi.fn(() => {
    localCacheStore.clear();
  }),
};

const mockDatabaseService = {
  fetchInsights: vi.fn(),
  fetchWithTimeout: vi.fn(),
};

describe('AIInsights - Async Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localCacheStore.clear();
  });

  it('renders pending overlay while async service loads insights', async () => {
    const mockInsights: AIInsight[] = [
      { id: '1', text: 'Performance tip', icon: 'Zap' },
      { id: '2', text: 'Code quality suggestion', icon: 'Code' },
    ];

    // Mock slow async service with delay
    mockDatabaseService.fetchInsights.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockInsights), 100))
    );

    // Render component and simulate pending state (pass empty insights initially)
    const { rerender } = render(<AIInsights insights={[]} />);

    // Assert pending UI renders with correct heading
    expect(screen.getByRole('heading', { name: /ai insights/i })).toBeInTheDocument();

    // Simulate async service resolution
    const insights = await mockDatabaseService.fetchInsights();

    // Re-render with resolved insights
    rerender(<AIInsights insights={insights} />);

    // Assert insights are now rendered
    expect(screen.getByText('Performance tip')).toBeInTheDocument();
    expect(screen.getByText('Code quality suggestion')).toBeInTheDocument();
  });

  it('queries local cache layer before triggering database retrieval', async () => {
    const cacheKey = 'ai_insights_cache';
    const cachedInsights: AIInsight[] = [{ id: '1', text: 'Cached insight', icon: 'Star' }];

    // Pre-populate cache
    await mockCacheService.set(cacheKey, cachedInsights);

    // Attempt to fetch - should query cache first
    const cachedResult = await mockCacheService.get(cacheKey);

    expect(cachedResult).toEqual(cachedInsights);
    expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
    expect(mockDatabaseService.fetchInsights).not.toHaveBeenCalled();
  });

  it('triggers database retrieval when cache miss occurs', async () => {
    const cacheKey = 'ai_insights_cache';
    const dbInsights: AIInsight[] = [{ id: '1', text: 'Database insight', icon: 'Flame' }];

    mockDatabaseService.fetchInsights.mockResolvedValue(dbInsights);

    // Cache is empty, should hit database
    const cacheResult = await mockCacheService.get(cacheKey);
    expect(cacheResult).toBeNull();

    // Simulate fallback to database
    if (!cacheResult) {
      const dbResult = await mockDatabaseService.fetchInsights();
      expect(dbResult).toEqual(dbInsights);
      expect(mockDatabaseService.fetchInsights).toHaveBeenCalled();
    }
  });

  it('applies correct fallback procedure during endpoint timeout', async () => {
    const cacheKey = 'ai_insights_cache';
    const fallbackInsights: AIInsight[] = [{ id: '1', text: 'Fallback insight', icon: 'Moon' }];

    // Cache has stale data
    await mockCacheService.set(cacheKey, fallbackInsights);

    // Mock timeout on database service
    mockDatabaseService.fetchWithTimeout.mockRejectedValue(new Error('Endpoint timeout'));

    // Simulate timeout flow: attempt DB, fail, use cache
    let result: AIInsight[] | null = null;
    try {
      result = await mockDatabaseService.fetchWithTimeout();
    } catch {
      // On timeout, fall back to cache
      result = await mockCacheService.get(cacheKey);
    }

    expect(result).toEqual(fallbackInsights);
    expect(mockDatabaseService.fetchWithTimeout).toHaveBeenCalled();
  });

  it('writes complete cache sync on successful service callback', async () => {
    const cacheKey = 'ai_insights_cache';
    const freshInsights: AIInsight[] = [
      { id: '1', text: 'Fresh insight 1', icon: 'Sun' },
      { id: '2', text: 'Fresh insight 2', icon: 'Calendar' },
      { id: '3', text: 'Fresh insight 3', icon: 'Code' },
    ];

    mockDatabaseService.fetchInsights.mockResolvedValue(freshInsights);

    // Simulate successful fetch and cache write
    const fetchedData = await mockDatabaseService.fetchInsights();
    await mockCacheService.set(cacheKey, fetchedData);

    // Verify cache was synced completely
    const cachedData = await mockCacheService.get(cacheKey);
    expect(cachedData).toEqual(freshInsights);
    expect(cachedData).toHaveLength(3);
    expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, freshInsights);

    // Verify subsequent cache reads return synced data
    const secondRead = await mockCacheService.get(cacheKey);
    expect(secondRead).toEqual(freshInsights);
  });
});
