// types/executive.ts
// Executive Open Source Intelligence Center types

export interface OrganizationKPI {
  totalRepos: number;
  totalContributors: number;
  totalStars: number;
  totalForks: number;
  avgHealth: number;
  openSourceScore: number;
}

export interface ExecutiveData {
  organization: OrganizationKPI;
  scorecard: EngineeringScorecard;
  repoHealth: RepoHealthSummary[];
  insights: ExecutiveInsight[];
}

export interface EngineeringScorecard {
  codeQuality: number;
  documentation: number;
  communityEngagement: number;
  security: number;
  overall: number;
}

export interface RepoHealthSummary {
  name: string;
  health: number;
  stars: number;
  openIssues: number;
  lastCommit: string;
}

export interface ExecutiveInsight {
  id: string;
  category: 'performance' | 'risk' | 'opportunity';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}
