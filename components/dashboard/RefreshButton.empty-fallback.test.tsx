import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RefreshButton from './RefreshButton';

const { successMock, pushMock, replaceMock, refreshMock } = vi.hoisted(() => ({
  successMock: vi.fn(),
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
  refreshMock: vi.fn(),
}));

let searchParams = new URLSearchParams();

vi.mock('sonner', () => ({
  toast: {
    success: successMock,
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => searchParams,
}));

vi.mock('lucide-react', () => ({
  RefreshCw: ({ className }: { className?: string }) => (
    <svg data-testid="refresh-icon" className={className} />
  ),
}));

describe('RefreshButton - Empty Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it('renders button when username is empty', () => {
    render(<RefreshButton username="" />);

    expect(
      screen.getByRole('button', {
        name: /refresh dashboard contribution data/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText('Refresh Data')).toBeInTheDocument();
  });

  it('does not show success toast when refresh query is absent', () => {
    render(<RefreshButton username="kanishka" />);

    expect(successMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('shows success toast and cleans url when refresh=true exists', () => {
    searchParams = new URLSearchParams('refresh=true');

    render(<RefreshButton username="kanishka" />);

    expect(successMock).toHaveBeenCalledWith('Dashboard refreshed successfully');

    expect(replaceMock).toHaveBeenCalledWith('/dashboard/kanishka');
  });

  it('renders correct accessibility attributes', () => {
    render(<RefreshButton username="test-user" />);

    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('aria-label', 'Refresh dashboard contribution data');

    expect(button).toHaveAttribute('title', 'Refresh dashboard contribution data');
  });

  it('handles refresh click without runtime errors', () => {
    render(<RefreshButton username="kanishka" />);

    fireEvent.click(screen.getByRole('button'));

    expect(pushMock).toHaveBeenCalledWith('/dashboard/kanishka?refresh=true');

    expect(refreshMock).toHaveBeenCalled();
  });
});
