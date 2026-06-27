import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RefreshButton from './RefreshButton';

// Mock next/navigation
const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('RefreshButton responsive breakpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders refresh button text', () => {
    render(<RefreshButton username="aanya" />);

    expect(screen.getByText('Refresh Data')).toBeDefined();
  });

  it('renders refresh button with accessible label', () => {
    render(<RefreshButton username="aanya" />);

    expect(screen.getByLabelText('Refresh dashboard contribution data')).toBeDefined();
  });

  it('renders button element correctly', () => {
    render(<RefreshButton username="aanya" />);

    expect(
      screen.getByRole('button', {
        name: /refresh dashboard contribution data/i,
      })
    ).toBeDefined();
  });

  it('calls router push when clicked', () => {
    render(<RefreshButton username="aanya" />);

    fireEvent.click(
      screen.getByRole('button', {
        name: /refresh dashboard contribution data/i,
      })
    );

    expect(pushMock).toHaveBeenCalled();
  });

  it('calls router refresh when clicked', () => {
    render(<RefreshButton username="aanya" />);

    fireEvent.click(
      screen.getByRole('button', {
        name: /refresh dashboard contribution data/i,
      })
    );

    expect(refreshMock).toHaveBeenCalled();
  });
});
