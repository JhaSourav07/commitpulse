export type RiskCategory = 'technical' | 'security' | 'operational' | 'compliance';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  id: string;
  category: RiskCategory;
  name: string;
  description: string;
  severity: number;
  level: RiskLevel;
  indicators: string[];
  affectedAreas: string[];
}

export interface RepositoryRisk {
  repositoryId: string;
  repositoryName: string;
  overallScore: number;
  overallLevel: RiskLevel;
  categories: Record<RiskCategory, { score: number; level: RiskLevel; factors: RiskFactor[] }>;
  riskFactors: RiskFactor[];
  trendData: RiskTrend[];
  lastUpdated: string;
  recommendations: RiskRecommendation[];
}

export interface RiskTrend {
  date: string;
  score: number;
  level: RiskLevel;
}

export interface RiskRecommendation {
  priority: number;
  category: RiskCategory;
  title: string;
  description: string;
  estimatedImpact: string;
  effort: 'low' | 'medium' | 'high';
}

export interface RiskThreshold {
  category: RiskCategory;
  warning: number;
  critical: number;
}

export interface RiskAlert {
  id: string;
  repositoryId: string;
  repositoryName: string;
  riskFactor: string;
  level: RiskLevel;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface RiskPortfolio {
  totalRepositories: number;
  averageRiskScore: number;
  repositoriesByLevel: Record<RiskLevel, string[]>;
  criticalRisks: RiskFactor[];
  trend: RiskTrend[];
}
