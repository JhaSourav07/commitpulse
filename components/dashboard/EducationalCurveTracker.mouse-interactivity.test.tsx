import { render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EducationalCurveTracker from './EducationalCurveTracker';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const timelineData = [
  { date: '2026-05-01', totalDailyCommits: 3, domains: {} },
  { date: '2026-05-02', totalDailyCommits: 7, domains: {} },
  { date: '2026-05-03', totalDailyCommits: 1, domains: {} },
];

const successPayload = {
  success: true,
  data: {
    totalStudyDays: 10,
    primaryDomain: 'Cloud Infrastructure',
    timeline: timelineData,
  },
};

describe('EducationalCurveTracker - Mouse Interactions & Hover Tooltips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ── Bar columns ───────────────────────────────────────────────────────────

  it('renders one bar column per timeline entry', async () => {
    mockFetch.mockResolvedValue({ json: async () => successPayload });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Cloud Infrastructure')).toBeInTheDocument();
    });

    // Each bar has an inline height style
    const bars = container.querySelectorAll('[style*="height"]');
    expect(bars.length).toBe(timelineData.length);
  });

  it('bar columns have hover transition classes', async () => {
    mockFetch.mockResolvedValue({ json: async () => successPayload });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Cloud Infrastructure')).toBeInTheDocument();
    });

    const firstBar = container.querySelector('[style*="height"]');
    expect(firstBar).toHaveClass('hover:bg-indigo-400');
    expect(firstBar).toHaveClass('transition-colors');
    expect(firstBar).toHaveClass('group');
  });

  // ── Tooltip content ───────────────────────────────────────────────────────

  it('renders tooltip with commit count for each bar', async () => {
    mockFetch.mockResolvedValue({ json: async () => successPayload });

    render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Cloud Infrastructure')).toBeInTheDocument();
    });

    // Tooltip text — each point's commit count is present in the DOM
    expect(screen.getByText('3 commits')).toBeInTheDocument();
    expect(screen.getByText('7 commits')).toBeInTheDocument();
    expect(screen.getByText('1 commits')).toBeInTheDocument();
  });

  it('renders tooltip with date for each bar', async () => {
    mockFetch.mockResolvedValue({ json: async () => successPayload });

    render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Cloud Infrastructure')).toBeInTheDocument();
    });

    expect(screen.getByText('2026-05-01')).toBeInTheDocument();
    expect(screen.getByText('2026-05-02')).toBeInTheDocument();
    expect(screen.getByText('2026-05-03')).toBeInTheDocument();
  });

  it('tooltip container has group-hover:block class (hidden by default, shown on hover)', async () => {
    mockFetch.mockResolvedValue({ json: async () => successPayload });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Cloud Infrastructure')).toBeInTheDocument();
    });

    const tooltip = container.querySelector('.group-hover\\:block');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveClass('hidden');
  });

  // ── Card hover classes ────────────────────────────────────────────────────

  it('card 1 has hover lift transition class', async () => {
    mockFetch.mockResolvedValue({ json: async () => successPayload });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Cloud Infrastructure')).toBeInTheDocument();
    });

    const card1 = container.querySelector('.col-span-1');
    expect(card1).toHaveClass('hover:-translate-y-1');
    expect(card1).toHaveClass('transition-transform');
  });

  it('card 2 has hover lift transition class', async () => {
    mockFetch.mockResolvedValue({ json: async () => successPayload });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Syllabus Momentum')).toBeInTheDocument();
    });

    const card2 = container.querySelector('.col-span-2');
    expect(card2).toHaveClass('hover:-translate-y-1');
    expect(card2).toHaveClass('transition-transform');
  });
});
