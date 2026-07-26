import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EducationalCurveTracker from './EducationalCurveTracker';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('EducationalCurveTracker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Use clearAllMocks to keep the mock active but wipe history
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the animated pulse skeleton initially', async () => {
    // FIX: Using .mockResolvedValue (not Once) to survive React StrictMode double-mounts
    mockFetch.mockResolvedValue({
      json: async () => ({ success: true, data: null }),
    });

    const { container } = render(<EducationalCurveTracker username="jalisa2106" />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders the data successfully after API fetch', async () => {
    const mockPayload = {
      success: true,
      data: {
        totalStudyDays: 14,
        primaryDomain: 'Applied AI & Data Mining',
        timeline: [{ date: '2026-04-15', totalDailyCommits: 5, domains: {} }],
      },
    };

    // FIX: Using .mockResolvedValue (not Once)
    mockFetch.mockResolvedValue({
      json: async () => mockPayload,
    });

    render(<EducationalCurveTracker username="jalisa2106" />);

    // Wait for the data to mount
    await waitFor(() => {
      expect(screen.getByText('Applied AI & Data Mining')).toBeInTheDocument();
    });

    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('Active Study Days')).toBeInTheDocument();
  });

  it('fails silently/renders nothing on API error', async () => {
    // FIX: Using .mockResolvedValue (not Once)
    mockFetch.mockResolvedValue({
      json: async () => ({ success: false, error: 'User not found' }),
    });

    const { container } = render(<EducationalCurveTracker username="unknown_user" />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
