/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import RefreshButton from './RefreshButton';

// Mock react to allow controlling useTransition's isPending state
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useTransition: vi.fn(),
  };
});

// Mock next/navigation — RefreshButton uses both useRouter and useSearchParams
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock sonner — so we can assert toast.success was called
vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));

// Named references so we can assert on them in tests
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // Default: no transition in progress
  // startTransition must actually invoke the callback it receives
  vi.mocked(useTransition).mockReturnValue([false, (cb) => cb()]);

  vi.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  } as any);

  vi.mocked(useSearchParams).mockReturnValue({
    get: vi.fn().mockReturnValue(null),
  } as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RefreshButton', () => {
  it("renders 'Refresh Data' button text", () => {
    render(<RefreshButton username="testuser" />);
    expect(screen.getByText('Refresh Data')).toBeDefined();
  });

  it('clicking the button calls router.push with ?refresh=true', () => {
    render(<RefreshButton username="testuser" />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/testuser?refresh=true');
  });

  it('shows toast.success when transition completes (isPending: true → false)', () => {
    // First render: isPending = true (transition in progress)
    vi.mocked(useTransition).mockReturnValue([true, (cb) => cb()]);

    const { rerender } = render(<RefreshButton username="testuser" />);

    // Toast should NOT fire while still pending
    expect(toast.success).not.toHaveBeenCalled();

    // Second render: isPending = false (transition completed)
    vi.mocked(useTransition).mockReturnValue([false, (cb) => cb()]);
    rerender(<RefreshButton username="testuser" />);

    expect(toast.success).toHaveBeenCalledWith('Dashboard refreshed successfully');
  });

  it('cleans up ?refresh=true from URL without showing toast', () => {
    // Simulate the URL being: /dashboard/testuser?refresh=true
    vi.mocked(useSearchParams).mockReturnValue({
      get: (key: string) => (key === 'refresh' ? 'true' : null),
    } as any);

    render(<RefreshButton username="testuser" />);

    // Should clean up the URL
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/testuser');
    // Should NOT show toast just because the param is present
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('button is disabled when isPending is true', () => {
    // Simulate a transition already in progress
    // startTransition still needs to invoke its callback even in pending state
    vi.mocked(useTransition).mockReturnValueOnce([true, (cb) => cb()]);

    render(<RefreshButton username="testuser" />);

    expect(screen.getByRole('button')).toHaveProperty('disabled', true);
  });
});
