import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExecutiveDashboard from './ExecutiveDashboard';
import type { ExecutiveDashboardData } from '@/types/executive';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockData: ExecutiveDashboardData = {
  currentReport: {
    id: 'report-1',
    title: 'Executive Summary',
    generatedAt: new Date().toISOString(),
    period: { start: '2024-01-01', end: '2024-01-31' },
    engineeringHealth: {
      overallScore: 82,
      productivityScore: 85,
      qualityScore: 88,
      sustainabilityScore: 78,
      velocityScore: 80,
    },
    metrics: [
      {
        id: 'v',
        name: 'Velocity',
        value: 127,
        previousValue: 115,
        unit: 'pts',
        trend: 'up',
        changePercent: 10,
      },
    ],
    teamCapacity: [
      {
        teamId: 't1',
        teamName: 'Team Alpha',
        members: 8,
        velocity: 45,
        capacity: 100,
        utilizationPercent: 85,
      },
    ],
    initiatives: [
      {
        id: 'i1',
        name: 'Cloud Migration',
        progress: 75,
        status: 'on-track',
        startDate: '2024-01-01',
        targetDate: '2024-06-01',
        health: 85,
        owner: 'Alice',
      },
    ],
    deploymentMetrics: {
      frequency: 12,
      leadTime: 4,
      changeFailureRate: 2.5,
      meanTimeToRestore: 45,
    },
    businessOutcomes: [],
    naturalLanguageSummary: 'Strong performance this quarter.',
  },
  historicalTrends: [],
  comparisons: [],
  alerts: [
    {
      id: 'a1',
      type: 'warning',
      message: 'Security risk detected',
      timestamp: new Date().toISOString(),
    },
  ],
};

describe('ExecutiveDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders component container', () => {
    render(<ExecutiveDashboard data={mockData} />);
    const container = document.querySelector('.shadow-sm');
    expect(container).toBeDefined();
  });
  it('renders dashboard with data', () => {
    render(<ExecutiveDashboard data={mockData} />);
    const cards = document.querySelectorAll('.rounded-xl');
    expect(cards.length).toBeGreaterThan(0);
  });
});
