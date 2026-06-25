export interface Collaborator {
  id: string;
  username: string;
  avatarUrl: string;
  contributions: number;
  reviews: number;
  comments: number;
  lastActive: string;
  teamId?: string;
}

export interface CollaborationPair {
  collaborator1: string;
  collaborator2: string;
  interactionCount: number;
  interactionTypes: ('pr_review' | 'pr_comment' | 'issue_comment' | 'commit')[];
  firstInteraction: string;
  lastInteraction: string;
  strength: 'weak' | 'moderate' | 'strong';
}

export interface ReviewMetrics {
  averageReviewTime: number;
  totalReviews: number;
  reviewsByWeek: { week: string; count: number }[];
  reviewersByCount: { username: string; count: number }[];
}

export interface TeamConnectivity {
  teamId: string;
  teamName: string;
  memberCount: number;
  internalConnections: number;
  externalConnections: number;
  connectivityScore: number;
  isolatedMembers: string[];
}

export interface CollaborationMetrics {
  totalCollaborators: number;
  activeCollaborators: number;
  averageInteractions: number;
  collaborationDiversityScore: number;
  busFactor: { repository: string; score: number; atRisk: boolean }[];
  mentorshipIndicators: { mentor: string; mentee: string; score: number }[];
}

export interface CollaborationData {
  collaborators: Collaborator[];
  collaborationPairs: CollaborationPair[];
  reviewMetrics: ReviewMetrics;
  teamConnectivity: TeamConnectivity[];
  overallMetrics: CollaborationMetrics;
  networkData: {
    nodes: { id: string; group: string }[];
    links: { source: string; target: string; value: number }[];
  };
  trends: { date: string; collaborationScore: number }[];
}

export interface CollaborationFilter {
  teamId?: string;
  repository?: string;
  dateRange?: { start: string; end: string };
  interactionType?: CollaborationPair['interactionTypes'][number];
}
