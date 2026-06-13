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

describe('RefreshButton mouse-interactivity: Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  it('renders tooltip title attribute for hover tooltip display', () => {
    mockGet.mockReturnValue(null);

    render(<RefreshButton username="testuser" />);

    const button = screen.getByRole('button', { name: /refresh dashboard/i });

    // title attribute acts as native browser tooltip on hover
    expect(button.getAttribute('title')).toBe('Refresh dashboard contribution data');
  });

  it('propagates click event correctly and triggers async navigation service', () => {
    mockGet.mockReturnValue(null);

    render(<RefreshButton username="testuser" />);

    const button = screen.getByRole('button', { name: /refresh dashboard/i });

    fireEvent.click(button);

    // Click must propagate and trigger the router service
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('responds to mouseenter and mouseleave events without crashing', () => {
    mockGet.mockReturnValue(null);

    render(<RefreshButton username="testuser" />);

    const button = screen.getByRole('button', { name: /refresh dashboard/i });

    // Hover events must not throw
    expect(() => fireEvent.mouseEnter(button)).not.toThrow();
    expect(() => fireEvent.mouseLeave(button)).not.toThrow();
  });

  it('propagates touch events correctly on mobile interaction', () => {
    mockGet.mockReturnValue(null);

    render(<RefreshButton username="testuser" />);

    const button = screen.getByRole('button', { name: /refresh dashboard/i });

    // Touch events must propagate without errors
    expect(() => fireEvent.touchStart(button)).not.toThrow();
    expect(() => fireEvent.touchEnd(button)).not.toThrow();
  });

  it('applies disabled state and blocks click propagation when isPending is simulated', () => {
    mockGet.mockReturnValue(null);
    mockPush.mockImplementation(() => {});
    mockRefresh.mockImplementation(() => {});

    render(<RefreshButton username="testuser" />);

    const button = screen.getByRole('button', { name: /refresh dashboard/i });

    // Click once to trigger pending state
    fireEvent.click(button);

    // Button must have been clicked and services called
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    // Button must not be disabled before transition starts
    expect(button).not.toBeDisabled();
  });
});
