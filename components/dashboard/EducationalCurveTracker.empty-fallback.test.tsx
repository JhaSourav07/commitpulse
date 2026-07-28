import { render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EducationalCurveTracker from './EducationalCurveTracker';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('EducationalCurveTracker - Empty & Fallback State Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ── Loading skeleton ──────────────────────────────────────────────────────

  it('shows the animate-pulse skeleton while data is being fetched', () => {
    // Never resolves — keeps component in loading state
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { container } = render(<EducationalCurveTracker username="user" />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('skeleton contains two placeholder blocks', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { container } = render(<EducationalCurveTracker username="user" />);

    const blocks = container.querySelectorAll('.h-48');
    expect(blocks.length).toBe(2);
  });

  it('skeleton disappears after data loads', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          totalStudyDays: 5,
          primaryDomain: 'ML',
          timeline: [{ date: '2026-05-01', totalDailyCommits: 3, domains: {} }],
        },
      }),
    });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });
  });

  // ── Empty timeline ────────────────────────────────────────────────────────

  it('shows "No educational commits in the recent window." when timeline is empty', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          totalStudyDays: 0,
          primaryDomain: 'Unknown',
          timeline: [],
        },
      }),
    });

    render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('No educational commits in the recent window.')).toBeInTheDocument();
    });
  });

  it('does not render any bar columns when timeline is empty', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          totalStudyDays: 0,
          primaryDomain: 'Unknown',
          timeline: [],
        },
      }),
    });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('No educational commits in the recent window.')).toBeInTheDocument();
    });

    // No bar column divs with inline height style
    const bars = container.querySelectorAll('[style*="height"]');
    expect(bars.length).toBe(0);
  });

  // ── Null data ─────────────────────────────────────────────────────────────

  it('renders nothing (null) when data is null after a successful response', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: true, data: null }),
    });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders nothing when success is false', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: false, error: 'Not found' }),
    });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  // ── "Last 30 Days" label ──────────────────────────────────────────────────

  it('renders "Last 30 Days" label in the chart card header', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          totalStudyDays: 2,
          primaryDomain: 'DevOps',
          timeline: [{ date: '2026-05-01', totalDailyCommits: 1, domains: {} }],
        },
      }),
    });

    render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
    });
  });
});
