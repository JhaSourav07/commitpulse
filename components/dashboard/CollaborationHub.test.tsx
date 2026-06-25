import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CollaborationHub from './CollaborationHub';
import type { CollaborationData } from '@/types/collaboration';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockData: CollaborationData = {
  collaborators: [
    {
      id: '1',
      username: 'alice',
      avatarUrl: '',
      contributions: 100,
      reviews: 20,
      comments: 50,
      lastActive: new Date().toISOString(),
    },
    {
      id: '2',
      username: 'bob',
      avatarUrl: '',
      contributions: 80,
      reviews: 15,
      comments: 40,
      lastActive: new Date().toISOString(),
    },
  ],
  collaborationPairs: [],
  reviewMetrics: {
    averageReviewTime: 24,
    totalReviews: 100,
    reviewsByWeek: [],
    reviewersByCount: [],
  },
  teamConnectivity: [
    {
      teamId: 'team-1',
      teamName: 'Team Alpha',
      memberCount: 5,
      internalConnections: 10,
      externalConnections: 3,
      connectivityScore: 75,
      isolatedMembers: [],
    },
  ],
  overallMetrics: {
    totalCollaborators: 2,
    activeCollaborators: 2,
    averageInteractions: 45,
    collaborationDiversityScore: 82,
    busFactor: [{ repository: 'repo-main', score: 45, atRisk: false }],
    mentorshipIndicators: [],
  },
  networkData: { nodes: [], links: [] },
  trends: [],
};

describe('CollaborationHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders component container', () => {
    render(<CollaborationHub data={mockData} />);
    const container = document.querySelector('.shadow-sm');
    expect(container).toBeDefined();
  });

  it('renders collaborator count', () => {
    render(<CollaborationHub data={mockData} />);
    expect(screen.getByText('2')).toBeDefined();
  });

  it('renders review metrics', () => {
    render(<CollaborationHub data={mockData} />);
    expect(screen.getByText('24h')).toBeDefined();
  });
});
