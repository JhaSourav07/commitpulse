import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeToggleButton } from './theme-switch';

function createLocalStorageMock(initial: Record<string, string | null> = {}) {
  const storage: Record<string, string | null> = { ...initial };
  return {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    }),
    key: vi.fn((index: number) => Object.keys(storage)[index] ?? null),
    get length() {
      return Object.keys(storage).length;
    },
  } as unknown as Storage;
}

describe('ThemeSwitch mock integrations', () => {
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;
  let originalDocumentElementClassList: string;

  beforeEach(() => {
    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;
    originalDocumentElementClassList = document.documentElement.className;
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: originalLocalStorage,
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });

    document.documentElement.className = originalDocumentElementClassList;
    vi.restoreAllMocks();
  });

  it('renders the toggle button and resolves hydration state asynchronously', async () => {
    const localStorageMock = createLocalStorageMock({ theme: 'light' });

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: localStorageMock,
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      }),
    });

    render(<ThemeToggleButton />);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeTruthy();

    await waitFor(() => {
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
    });
  });

  it('queries local cache before writing theme sync data on mount', async () => {
    const localStorageMock = createLocalStorageMock({ theme: 'light' });

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: localStorageMock,
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      }),
    });

    render(<ThemeToggleButton />);

    await waitFor(() => {
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });
  });

  it('writes cache sync and toggles theme when reduced motion is enabled', async () => {
    const localStorageMock = createLocalStorageMock({ theme: 'light' });
    const toggleSpy = vi.fn();

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: localStorageMock,
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      })),
    });

    document.documentElement.style.colorScheme = 'light';

    render(<ThemeToggleButton />);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    const button = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });
  });

  it('falls back to a safe default when the cache is empty and still persists theme state', async () => {
    const localStorageMock = createLocalStorageMock({});

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: localStorageMock,
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      }),
    });

    document.documentElement.style.colorScheme = 'light';

    render(<ThemeToggleButton />);

    await waitFor(() => {
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });
  });

  it('stubs local cache and preserves theme sync state across repeated toggles', async () => {
    const localStorageMock = createLocalStorageMock({ theme: 'light' });

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: localStorageMock,
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      })),
    });

    vi.spyOn(document.documentElement.classList, 'toggle').mockImplementation(vi.fn());
    document.documentElement.style.colorScheme = 'light';

    render(<ThemeToggleButton />);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });
  });
});
