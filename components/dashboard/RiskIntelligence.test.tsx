import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskIntelligence from './RiskIntelligence';
import type { RepositoryRisk } from '@/types/risk';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockRiskData: RepositoryRisk = {
  repositoryId: 'repo-alpha',
  repositoryName: 'alpha-repo',
  overallScore: 45,
  overallLevel: 'medium',
  categories: {
    technical: { score: 30, level: 'low', factors: [] },
    security: { score: 55, level: 'high', factors: [] },
    operational: { score: 40, level: 'medium', factors: [] },
    compliance: { score: 20, level: 'low', factors: [] },
  },
  riskFactors: [
    {
      id: 'rf-1',
      category: 'security',
      name: 'Test Risk',
      description: 'Test description',
      severity: 55,
      level: 'high',
      indicators: [],
      affectedAreas: [],
    },
  ],
  trendData: [],
  lastUpdated: new Date().toISOString(),
  recommendations: [
    {
      priority: 1,
      category: 'security',
      title: 'Security Fix Required',
      description: 'Address security vulnerabilities',
      estimatedImpact: 'High',
      effort: 'medium',
    },
  ],
};

describe('RiskIntelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders component container', () => {
    render(<RiskIntelligence data={mockRiskData} />);
    const container = document.querySelector('.shadow-sm');
    expect(container).toBeDefined();
  });

  it('renders risk data correctly', () => {
    render(<RiskIntelligence data={mockRiskData} />);
    expect(screen.getByText('45')).toBeDefined();
    expect(screen.getByText('medium')).toBeDefined();
  });

  it('renders risk categories', () => {
    render(<RiskIntelligence data={mockRiskData} />);
    expect(screen.getByText('55')).toBeDefined();
  });
});
