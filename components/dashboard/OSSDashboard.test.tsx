import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OSSDashboard from './OSSDashboard';
import type { OSSProjectHealth } from '@/types/opensource';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockData: OSSProjectHealth = {
  projectId: 'proj-1',
  projectName: 'test-project',
  healthScore: {
    overall: 75,
    contributorHealth: 80,
    issueManagement: 70,
    releaseHealth: 75,
    communityEngagement: 75,
    riskIndicators: [],
  },
  contributors: [],
  retention: [],
  issueMetrics: {
    averageFirstResponseTime: 24,
    averageResolutionTime: 120,
    openIssues: 50,
    closedIssues: 200,
    issuesByPriority: [],
    responseTrend: [],
  },
  releaseMetrics: {
    totalReleases: 12,
    releasesByMonth: [],
    averageReleaseInterval: 14,
    latestRelease: { version: '1.0.0', date: '2024-01-01', changes: 10 },
  },
  communityGrowth: {
    totalContributors: 50,
    contributorsByMonth: [],
    contributorDiversity: 72,
    activeContributorsLastMonth: 20,
    returningContributors: 15,
  },
  maintainerWorkload: [],
  trends: [],
  benchmarks: [],
};

describe('OSSDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders component container', () => {
    render(<OSSDashboard data={mockData} />);
    const container = document.querySelector('.shadow-sm');
    expect(container).toBeDefined();
  });
  it('renders dashboard with data', () => {
    render(<OSSDashboard data={mockData} />);
    const cards = document.querySelectorAll('.rounded-xl');
    expect(cards.length).toBeGreaterThan(0);
  });
});
