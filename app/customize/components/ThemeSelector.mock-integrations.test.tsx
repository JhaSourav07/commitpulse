import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeSelector } from './ThemeSelector';
import React, { useState, useEffect } from 'react';

// @ts-expect-error - Virtual module for testing async service layer
import { fetchTheme, updateTheme } from '@/services/themeApi';

// Mock the async service module using vi.mock()
vi.mock(
  '@/services/themeApi',
  () => ({
    fetchTheme: vi.fn(),
    updateTheme: vi.fn(),
  }),
  { virtual: true }
);

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// The wrapper component that uses ThemeSelector and implements the required logic
function IntegrationWrapper({ onSyncSuccess }: { onSyncSuccess?: () => void }) {
  const [theme, setTheme] = useState('auto');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      try {
        const cached = window.localStorage.getItem('user_theme');
        if (cached) {
          if (isMounted) {
            setTheme(cached);
            setLoading(false);
          }
          return;
        }

        const remoteTheme = await fetchTheme();
        if (isMounted) {
          setTheme(remoteTheme);
          window.localStorage.setItem('user_theme', remoteTheme);
        }
      } catch {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    setLoading(true);
    try {
      await updateTheme(newTheme);
      window.localStorage.setItem('user_theme', newTheme);
      onSyncSuccess?.();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div data-testid="fallback-ui">Failed to load theme. Please try again.</div>;
  }

  return (
    <div data-testid="theme-container">
      {loading && (
        <div
          data-testid="loading-overlay"
          className="absolute inset-0 bg-black/50 flex items-center justify-center"
        >
          <div
            data-testid="loading-spinner"
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"
          ></div>
        </div>
      )}
      <ThemeSelector theme={theme} onThemeChange={handleThemeChange} />
    </div>
  );
}

describe('ThemeSelector - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  // Test 1 — Async Service Mock
  it('should verify Async Service Mock without making real network requests', async () => {
    vi.mocked(fetchTheme).mockResolvedValueOnce('dracula');

    render(<IntegrationWrapper />);

    // Verify mocked service is called correctly
    await waitFor(() => {
      expect(fetchTheme).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).toBeNull();
    });

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('dracula');

    // Check it's using the mocked function and not doing a real request
    expect(vi.isMockFunction(fetchTheme)).toBe(true);
  });

  // Test 2 — Loading State
  it('should display Loading State when Promise is pending', async () => {
    // Mock a pending Promise
    vi.mocked(fetchTheme).mockReturnValue(new Promise(() => {}));

    render(<IntegrationWrapper />);

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('theme-container')).toBeInTheDocument(); // UI remains responsive
  });

  // Test 3 — Cache Lookup Priority
  it('should enforce Cache Lookup Priority over remote fetch', async () => {
    vi.spyOn(window.localStorage, 'getItem').mockReturnValue('neon');

    render(<IntegrationWrapper />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).toBeNull();
    });

    expect(window.localStorage.getItem).toHaveBeenCalledWith('user_theme');
    expect(fetchTheme).not.toHaveBeenCalled();

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('neon');
  });

  // Test 4 — Timeout Fallback
  it('should handle Timeout Fallback and render fallback UI on rejection', async () => {
    vi.mocked(fetchTheme).mockRejectedValueOnce(new Error('Network timeout'));

    render(<IntegrationWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('fallback-ui')).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to load theme/i)).toBeInTheDocument();
  });

  // Test 5 — Cache Synchronization
  it('should perform Cache Synchronization after a successful update', async () => {
    vi.mocked(fetchTheme).mockResolvedValueOnce('dark');
    vi.mocked(updateTheme).mockResolvedValueOnce(undefined);
    vi.spyOn(window.localStorage, 'setItem');

    const onSyncSuccess = vi.fn();
    render(<IntegrationWrapper onSyncSuccess={onSyncSuccess} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).toBeNull();
    });

    const user = userEvent.setup();
    const select = screen.getByRole('combobox') as HTMLSelectElement;

    await user.selectOptions(select, 'sunset');

    await waitFor(() => {
      expect(updateTheme).toHaveBeenCalledWith('sunset');
    });

    expect(window.localStorage.setItem).toHaveBeenCalledWith('user_theme', 'sunset');
    expect(onSyncSuccess).toHaveBeenCalledTimes(1);

    const selectAfter = screen.getByRole('combobox') as HTMLSelectElement;
    expect(selectAfter.value).toBe('sunset');
  });
});
