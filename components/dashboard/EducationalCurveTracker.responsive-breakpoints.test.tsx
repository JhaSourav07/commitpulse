import { render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EducationalCurveTracker from './EducationalCurveTracker';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const fullPayload = {
  success: true,
  data: {
    totalStudyDays: 8,
    primaryDomain: 'Systems Design',
    timeline: [
      { date: '2026-05-10', totalDailyCommits: 4, domains: {} },
      { date: '2026-05-11', totalDailyCommits: 6, domains: {} },
    ],
  },
};

describe('EducationalCurveTracker - Responsive Breakpoints & Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ── Outer grid ────────────────────────────────────────────────────────────

  it('outer grid has grid-cols-1 and md:grid-cols-3 classes', async () => {
    mockFetch.mockResolvedValue({ json: async () => fullPayload });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Systems Design')).toBeInTheDocument();
    });

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-3');
  });

  it('outer grid has gap-6 class', async () => {
    mockFetch.mockResolvedValue({ json: async () => fullPayload });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Systems Design')).toBeInTheDocument();
    });

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('gap-6');
  });

  // ── Card span classes ─────────────────────────────────────────────────────

  it('card 1 (Current Focus) uses col-span-1', async () => {
    mockFetch.mockResolvedValue({ json: async () => fullPayload });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Systems Design')).toBeInTheDocument();
    });

    const card1 = container.querySelector('.col-span-1');
    expect(card1).toBeInTheDocument();
  });

  it('card 2 (Syllabus Momentum) uses col-span-2', async () => {
    mockFetch.mockResolvedValue({ json: async () => fullPayload });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Syllabus Momentum')).toBeInTheDocument();
    });

    const card2 = container.querySelector('.col-span-2');
    expect(card2).toBeInTheDocument();
  });

  // ── Max-width & padding ───────────────────────────────────────────────────

  it('wrapper has max-w-7xl and responsive horizontal padding', async () => {
    mockFetch.mockResolvedValue({ json: async () => fullPayload });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(screen.getByText('Systems Design')).toBeInTheDocument();
    });

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('max-w-7xl');
    expect(wrapper).toHaveClass('px-4');
    expect(wrapper).toHaveClass('sm:px-6');
    expect(wrapper).toHaveClass('lg:px-8');
  });

  // ── Skeleton also has responsive grid ────────────────────────────────────

  it('loading skeleton uses the same grid-cols-1 md:grid-cols-3 layout', () => {
    // Never resolves — keeps component in loading state
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { container } = render(<EducationalCurveTracker username="user" />);

    const skeletonGrid = container.querySelector('.animate-pulse');
    expect(skeletonGrid).toHaveClass('grid-cols-1');
    expect(skeletonGrid).toHaveClass('md:grid-cols-3');
  });

  it('skeleton card 1 uses col-span-1', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { container } = render(<EducationalCurveTracker username="user" />);

    const skeletonCard1 = container.querySelector('.animate-pulse .col-span-1');
    expect(skeletonCard1).toBeInTheDocument();
  });

  it('skeleton card 2 uses col-span-2', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { container } = render(<EducationalCurveTracker username="user" />);

    const skeletonCard2 = container.querySelector('.animate-pulse .col-span-2');
    expect(skeletonCard2).toBeInTheDocument();
  });
});
