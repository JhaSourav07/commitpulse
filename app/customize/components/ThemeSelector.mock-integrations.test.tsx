import React, { useState, useEffect } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeSelector } from './ThemeSelector';

// Mock the translation context
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// --- Mock Integration Setup ---
// We simulate a parent component that manages theme state asynchronously
// and interacts with localStorage (cache) and fetch (API service).
function AsyncThemeIntegration() {
  const [theme, setTheme] = useState<string>(() => {
    const cached = localStorage.getItem('theme-cache');
    return cached ? cached : 'auto';
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const handleThemeChange = async (newTheme: string) => {
    setStatus('loading');
    try {
      // 2. Async service call
      const res = await fetch('/api/user/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (!res.ok) {
        throw new Error('Service timeout or rejection');
      }

      // 3. Update cache and state on success
      localStorage.setItem('theme-cache', newTheme);
      setTheme(newTheme);
      setStatus('idle');
    } catch {
      // 4. Fallback behavior
      setStatus('error');
    }
  };

  return (
    <div data-testid="integration-wrapper">
      {status === 'loading' && <div data-testid="loading-indicator">Saving theme...</div>}
      {status === 'error' && (
        <div data-testid="error-fallback">Failed to save theme. Please try again.</div>
      )}
      <ThemeSelector theme={theme} onThemeChange={handleThemeChange} />
    </div>
  );
}

describe('ThemeSelector - Async Mock Integrations (Variation 11)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let localStorageGetSpy: ReturnType<typeof vi.spyOn>;
  let localStorageSetSpy: ReturnType<typeof vi.spyOn>;
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    // Reset DOM and mocks
    vi.clearAllMocks();
    mockStorage = {};

    // Mock global fetch
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    // Mock localStorage
    localStorageGetSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      return mockStorage[key] || null;
    });
    localStorageSetSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => {
      mockStorage[key] = val;
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    localStorageGetSpy.mockRestore();
    localStorageSetSpy.mockRestore();
  });

  it('1. Local Cache Verification: verifies the local cache is checked before any async service/database call', () => {
    mockStorage['theme-cache'] = 'ocean';
    render(<AsyncThemeIntegration />);

    expect(localStorageGetSpy).toHaveBeenCalledWith('theme-cache');
    expect(screen.getByRole('combobox')).toHaveValue('ocean');
  });

  it('2. Pending/Loading State: tests that pending/loading state is rendered while async operations are unresolved', async () => {
    // Delay the fetch resolution to ensure loading state is visible
    let resolveFetch: (value: Response) => void = () => {};
    fetchSpy.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve as (value: Response) => void;
        })
    );

    render(<AsyncThemeIntegration />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'sunset' } });

    // Verify loading state is rendered
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

    // Resolve the promise
    resolveFetch({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
  });

  it('3. Cache Synchronization: verifies successful responses update/synchronize the local cache', async () => {
    render(<AsyncThemeIntegration />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'neon' } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/user/theme',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ theme: 'neon' }),
        })
      );
    });

    await waitFor(() => {
      expect(localStorageSetSpy).toHaveBeenCalledWith('theme-cache', 'neon');
    });

    expect(screen.getByRole('combobox')).toHaveValue('neon');
  });

  it('4. Fallback Behavior: verifies fallback behavior when the mocked service times out or rejects', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network Timeout'));

    render(<AsyncThemeIntegration />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'dark' } });

    await waitFor(() => {
      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
    });

    // Cache should not be updated with the failed theme
    expect(localStorageSetSpy).not.toHaveBeenCalled();
    // Theme should revert or remain unchanged ('auto' was the initial state)
    expect(screen.getByRole('combobox')).toHaveValue('auto');
  });

  it('5. Deterministic Isolation: verifies mocks are properly reset and restored between test runs', () => {
    render(<AsyncThemeIntegration />);

    // The previous tests should not bleed into this one
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSetSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('combobox')).toHaveValue('auto');
  });
});
