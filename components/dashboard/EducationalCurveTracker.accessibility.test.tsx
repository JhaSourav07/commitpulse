import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EducationalCurveTracker from './EducationalCurveTracker';

// Safely mock global fetch without using 'any'
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('EducationalCurveTracker Accessibility', () => {
  it('should render semantic HTML and accessible roles', async () => {
    const mockPayload = {
      success: true,
      data: {
        totalStudyDays: 5,
        primaryDomain: 'Computer Architecture & Systems',
        timeline: [
          { date: '2026-04-10', totalDailyCommits: 2, domains: {} },
          { date: '2026-04-11', totalDailyCommits: 4, domains: {} },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      json: async () => mockPayload,
    });

    render(<EducationalCurveTracker username="jalisa2106" />);

    // Wait for component to mount data
    await waitFor(() => {
      expect(screen.getByText('Computer Architecture & Systems')).toBeInTheDocument();
    });

    // Verify structural accessibility (Screen readers rely heavily on standard heading roles)
    expect(screen.getByRole('heading', { name: /Current Focus/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Syllabus Momentum/i })).toBeInTheDocument();
  });
});
