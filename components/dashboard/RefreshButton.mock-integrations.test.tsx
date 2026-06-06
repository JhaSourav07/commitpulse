import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import RefreshButton from './RefreshButton';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockGet = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: mockGet,
    toString: () => '',
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  RefreshCw: ({ className }: { className?: string }) => (
    <svg data-testid="refresh-icon" className={className} />
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('RefreshButton mock-integrations: Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  it('renders the button in idle state without triggering any async service call on mount', () => {
    mockGet.mockReturnValue(null);

    render(<RefreshButton username="testuser" />);

    const button = screen.getByRole('button', { name: /refresh dashboard/i });

    expect(button).toBeDefined();
    expect(button).not.toBeDisabled();
    expect(screen.getByText('Refresh Data')).toBeDefined();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('triggers router push and refresh as async service calls when button is clicked', () => {
    mockGet.mockReturnValue(null);

    render(<RefreshButton username="testuser" />);

    const button = screen.getByRole('button', { name: /refresh dashboard/i });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/dashboard/testuser?refresh=true');
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('queries local cache (searchParams) before triggering navigation service', () => {
    mockGet.mockReturnValue(null);

    render(<RefreshButton username="testuser" />);

    expect(mockGet).toHaveBeenCalledWith('refresh');
  });

  it('executes cache sync and cleanup on successful refresh callback', async () => {
    const { toast } = await import('sonner');

    mockGet.mockReturnValue('true');

    render(<RefreshButton username="testuser" />);

    expect(toast.success).toHaveBeenCalledWith('Dashboard refreshed successfully');
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/testuser');
  });

  it('falls back cleanly without crashing when router service methods are stubbed as no-ops', () => {
    mockGet.mockReturnValue(null);
    mockPush.mockImplementation(() => {});
    mockRefresh.mockImplementation(() => {});

    render(<RefreshButton username="testuser" />);

    const button = screen.getByRole('button', { name: /refresh dashboard/i });

    expect(() => fireEvent.click(button)).not.toThrow();
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
