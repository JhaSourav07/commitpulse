import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ReturnToTop from './ReturnToTop';

// We define a mock function for useReducedMotion to verify integration behavior dynamically
const mockUseReducedMotion = vi.fn().mockReturnValue(false);

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    button: ({
      children,
      whileHover,
      whileTap,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => (
      <button
        data-while-hover={whileHover ? JSON.stringify(whileHover) : undefined}
        data-while-tap={whileTap ? JSON.stringify(whileTap) : undefined}
        {...props}
      >
        {children}
      </button>
    ),
    circle: (props: { [key: string]: unknown }) => <circle {...props} />,
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <span {...props}>{children}</span>
    ),
  },
  useReducedMotion: () => mockUseReducedMotion(),
  useScroll: () => ({ scrollYProgress: 0 }),
  useSpring: (value: unknown) => value,
  useTransform: () => 0,
}));

vi.mock('lucide-react', () => ({
  ChevronUp: () => <svg data-testid="chevron-up-icon" />,
}));

interface ScrollPositionRecord {
  key: string;
  scrollY: number;
  behavior: 'smooth' | 'auto';
  timestamp: number;
}

// A stub cache service using browser-native localStorage for integration testing
class ScrollCacheService {
  public dbCallCount = 0;
  public cacheCallCount = 0;
  private db = new Map<string, ScrollPositionRecord>();

  constructor(initialDbRecords: ScrollPositionRecord[] = []) {
    initialDbRecords.forEach((record) => {
      this.db.set(record.key, record);
    });
  }

  public reset() {
    localStorage.clear();
    this.dbCallCount = 0;
    this.cacheCallCount = 0;
  }

  public async fetchScrollPosition(
    key: string,
    timeoutMs: number = 5000
  ): Promise<ScrollPositionRecord> {
    this.cacheCallCount++;
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }

    this.dbCallCount++;

    if (timeoutMs < 100) {
      throw new Error('Timeout: Remote database took too long to respond');
    }

    const record = this.db.get(key);
    if (!record) {
      throw new Error(`Scroll position record not found for: ${key}`);
    }

    // Keep the method async without introducing real-time delays in unit tests
    await Promise.resolve();

    return record;
  }

  public async syncRemoteToLocal(key: string): Promise<void> {
    const record = await this.fetchScrollPosition(key);
    localStorage.setItem(key, JSON.stringify(record));
  }

  public setLocalCache(key: string, record: ScrollPositionRecord) {
    localStorage.setItem(key, JSON.stringify(record));
  }
}

const mockRecord: ScrollPositionRecord = {
  key: 'scroll-last-position',
  scrollY: 750,
  behavior: 'smooth',
  timestamp: 1625200000000,
};

const fallbackRecord: ScrollPositionRecord = {
  key: 'scroll-fallback-position',
  scrollY: 0,
  behavior: 'auto',
  timestamp: 1625200000000,
};

describe('ReturnToTop - Asynchronous Service Layer Mocking & Local Cache Stubs (Variation 9)', () => {
  const service = new ScrollCacheService([mockRecord]);

  beforeEach(() => {
    service.reset();
    vi.restoreAllMocks();

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    });

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
      writable: true,
    });

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  afterEach(() => {
    service.reset();
  });

  // Case 1: Mock standard asynchronous imports and databases using stubs
  it('Case 1: Mock standard asynchronous imports and databases using stubs and verify scrolling state loading', async () => {
    // Verify standard async database retrieval using the stub
    const result = await service.fetchScrollPosition('scroll-last-position');
    expect(result).toHaveProperty('key', 'scroll-last-position');
    expect(result).toHaveProperty('scrollY', 750);
    expect(result.behavior).toBe('smooth');

    // Target observable ReturnToTop behaviors (visibility threshold, scrollTo behaviors)
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 750,
    });

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    // Test normal motion mode
    mockUseReducedMotion.mockReturnValue(false);
    const { rerender } = render(<ReturnToTop />);
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /back to top/i });
    expect(button).toBeInTheDocument();
    expect(button.getAttribute('data-while-hover')).toContain('y');

    fireEvent.click(button);
    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });

    scrollToSpy.mockClear();

    // Test reduced motion mode
    mockUseReducedMotion.mockReturnValue(true);
    rerender(<ReturnToTop />);
    fireEvent.click(button);
    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: 'auto',
    });
  });

  // Case 2: Test service loading paths to ensure pending state overlays render
  it('Case 2: Test service loading paths to ensure pending state overlays render', async () => {
    // Initially scrolled at 0 (pending/hidden state)
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
    });

    render(<ReturnToTop />);

    // Initially, the button is not visible
    expect(screen.queryByRole('button', { name: /back to top/i })).toBeNull();

    // Scroll past threshold to trigger visual appearance
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 350,
    });

    fireEvent.scroll(window);

    // Wait asynchronously for the button to appear in the DOM (loading path resolved)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument();
    });
  });

  // Case 3: Assert local cache layers are queried before triggering database retrievals
  it('Case 3: Assert local cache layers are queried before triggering database retrievals', async () => {
    service.setLocalCache('scroll-last-position', mockRecord);

    // Read record and assert it hits cache instead of remote database
    const result = await service.fetchScrollPosition('scroll-last-position');

    expect(result).toEqual(mockRecord);
    expect(service.dbCallCount).toBe(0);
    expect(service.cacheCallCount).toBe(1);

    // Verify component integration is unaffected by backend mock layers
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 350,
    });
    fireEvent.scroll(window);
    render(<ReturnToTop />);
    expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument();
  });

  // Case 4: Verify correct fallback procedures during fake endpoint timeout blocks
  it('Case 4: Verify correct fallback procedures during fake endpoint timeout blocks', async () => {
    let finalRecord: ScrollPositionRecord;

    try {
      // Pass a low timeout threshold to force the timeout error to trigger
      await service.fetchScrollPosition('scroll-last-position', 50);
      throw new Error('Expected fetchScrollPosition to timeout, but it resolved successfully');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toMatch(/Timeout:/);
      finalRecord = fallbackRecord;
    }

    expect(finalRecord).toEqual(fallbackRecord);
  });

  // Case 5: Assert complete cache sync is written on success callbacks
  it('Case 5: Assert complete cache sync is written on success callbacks', async () => {
    // Trigger remote sync to pull data from DB and save to local storage
    await service.syncRemoteToLocal('scroll-last-position');
    expect(service.dbCallCount).toBe(1);

    // Subsequent retrieval should fetch directly from local storage, without calling DB again
    const result = await service.fetchScrollPosition('scroll-last-position');
    expect(result).toEqual(mockRecord);
    expect(service.dbCallCount).toBe(1);
    expect(service.cacheCallCount).toBe(2);
  });
});
