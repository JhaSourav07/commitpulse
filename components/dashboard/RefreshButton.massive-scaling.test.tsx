import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RefreshButton from './RefreshButton';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));

vi.mock('lucide-react', () => ({
  RefreshCw: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="refresh-icon" width={size} height={size} className={className} />
  ),
}));

import { useRouter, useSearchParams } from 'next/navigation';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

const emptySearchParams = new URLSearchParams();

function setupMocks(params: URLSearchParams = emptySearchParams) {
  vi.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  } as unknown as ReturnType<typeof useRouter>);

  vi.mocked(useSearchParams).mockReturnValue(
    params as unknown as ReturnType<typeof useSearchParams>
  );
}

describe('RefreshButton — Massive Data Sets and Extreme High Bounds Scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it('renders correctly with a maximum-length 39-character GitHub username', () => {
    const maxUsername = 'a'.repeat(39);
    setupMocks();

    render(<RefreshButton username={maxUsername} />);

    const button = screen.getByRole('button', {
      name: /refresh dashboard contribution data/i,
    });
    expect(button).toBeTruthy();
    expect(button.getAttribute('aria-label')).toBe('Refresh dashboard contribution data');
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('constructs the correct URL when searchParams contains 100 existing key-value pairs', () => {
    const manyParams = new URLSearchParams();
    for (let i = 0; i < 100; i++) {
      manyParams.set(`param${i}`, `value${i}`);
    }
    setupMocks(manyParams);

    render(<RefreshButton username="octocat" />);

    const button = screen.getByRole('button', {
      name: /refresh dashboard contribution data/i,
    });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledTimes(1);

    const pushedUrl: string = mockPush.mock.calls[0][0] as string;
    expect(pushedUrl).toContain('/dashboard/octocat');
    expect(pushedUrl).toContain('refresh=true');
    expect(pushedUrl).toContain('param0=value0');
    expect(pushedUrl).toContain('param99=value99');
  });

  it('renders 100 consecutive instances without throwing or crashing', () => {
    expect(() => {
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(<RefreshButton username={`user-${i}`} />);
        unmount();
      }
    }).not.toThrow();
  });

  it('renders correctly with a hyphenated numeric GitHub username and routes to the correct path', () => {
    const hyphenatedUsername = 'octo-cat-42';
    setupMocks();

    render(<RefreshButton username={hyphenatedUsername} />);

    const button = screen.getByRole('button', {
      name: /refresh dashboard contribution data/i,
    });
    expect(button).toBeTruthy();

    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedUrl: string = mockPush.mock.calls[0][0] as string;
    expect(pushedUrl).toContain('/dashboard/octo-cat-42');
    expect(pushedUrl).toContain('refresh=true');

    cleanup();
  });

  it('handleRefresh executes within 200ms even with 100 search parameters', () => {
    const heavyParams = new URLSearchParams();
    for (let i = 0; i < 100; i++) {
      heavyParams.set(`key${i}`, `value${i}`);
    }
    setupMocks(heavyParams);

    render(<RefreshButton username="octocat" />);

    const button = screen.getByRole('button', {
      name: /refresh dashboard contribution data/i,
    });

    const start = performance.now();
    fireEvent.click(button);
    const elapsed = performance.now() - start;

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(elapsed).toBeLessThan(200);
  });
});
