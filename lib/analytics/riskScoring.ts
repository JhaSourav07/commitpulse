import type {
  RiskFactor,
  RiskLevel,
  RiskCategory,
  RepositoryRisk,
  RiskTrend,
  RiskRecommendation,
  RiskPortfolio,
} from '@/types/risk';

function calculateSeverityScore(severity: number): number {
  return Math.min(100, Math.max(0, severity));
}

function determineLevel(score: number): RiskLevel {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

function generateRiskFactors(repositoryId: string): RiskFactor[] {
  const seed = repositoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const factors: RiskFactor[] = [];

  const categories: RiskCategory[] = ['technical', 'security', 'operational', 'compliance'];
  const riskNames: Record<RiskCategory, { name: string; description: string }[]> = {
    technical: [
      { name: 'Code Stagnation', description: 'Low commit frequency detected' },
      { name: 'Technical Debt', description: 'Accumulated code quality issues' },
      { name: 'Dependency Outdated', description: 'Dependencies need updates' },
    ],
    security: [
      { name: 'Vulnerability Exposure', description: 'Known vulnerabilities detected' },
      { name: 'Outdated Dependencies', description: 'Security patches available' },
      { name: 'Weak Access Controls', description: 'Permission review needed' },
    ],
    operational: [
      { name: 'Maintainer Burnout', description: 'Single maintainer high workload' },
      { name: 'Slow Issue Resolution', description: 'Backlog accumulating' },
      { name: 'Documentation Gap', description: 'Missing or outdated docs' },
    ],
    compliance: [
      { name: 'License Risk', description: 'Check license compatibility' },
      { name: 'Audit Trail Gap', description: 'Missing change documentation' },
      { name: 'Security Policy', description: 'Policy review needed' },
    ],
  };

  categories.forEach((category, catIndex) => {
    const shouldInclude = (seed + catIndex) % 3 !== 0;
    if (shouldInclude) {
      const categoryRisks = riskNames[category];
      const riskIndex = (seed + catIndex) % categoryRisks.length;
      const risk = categoryRisks[riskIndex];
      const severity = (seed * (catIndex + 1)) % 100;

      factors.push({
        id: `${repositoryId}-${category}-${riskIndex}`,
        category,
        name: risk.name,
        description: risk.description,
        severity,
        level: determineLevel(severity),
        indicators: [`Indicator 1 for ${risk.name}`, `Evidence of ${risk.name}`],
        affectedAreas: ['Area 1', 'Area 2'],
      });
    }
  });

  return factors;
}

function calculateCategoryScores(
  factors: RiskFactor[]
): Record<RiskCategory, { score: number; level: RiskLevel; factors: RiskFactor[] }> {
  const categories: RiskCategory[] = ['technical', 'security', 'operational', 'compliance'];
  const result = {} as Record<
    RiskCategory,
    { score: number; level: RiskLevel; factors: RiskFactor[] }
  >;

  categories.forEach((category) => {
    const categoryFactors = factors.filter((f) => f.category === category);
    const avgSeverity =
      categoryFactors.length > 0
        ? categoryFactors.reduce((sum, f) => sum + f.severity, 0) / categoryFactors.length
        : 0;

    result[category] = {
      score: calculateSeverityScore(avgSeverity),
      level: determineLevel(avgSeverity),
      factors: categoryFactors,
    };
  });

  return result;
}

function generateRecommendations(
  repositoryId: string,
  categories: Record<RiskCategory, { score: number; level: RiskLevel }>
): RiskRecommendation[] {
  const recommendations: RiskRecommendation[] = [];
  let priority = 1;

  const categoryOrder: RiskCategory[] = ['security', 'technical', 'operational', 'compliance'];
  categoryOrder.forEach((category) => {
    const cat = categories[category];
    if (cat.score >= 50) {
      recommendations.push({
        priority: priority++,
        category,
        title: `Address ${category} risks`,
        description: `High ${category} risk score detected. Review and remediate ${category} issues.`,
        estimatedImpact: cat.score >= 75 ? 'Critical risk reduction' : 'Significant risk reduction',
        effort: cat.score >= 75 ? 'high' : 'medium',
      });
    }
  });

  return recommendations;
}

export function analyzeRepositoryRisk(
  repositoryId: string,
  repositoryName: string
): RepositoryRisk {
  const riskFactors = generateRiskFactors(repositoryId);
  const categories = calculateCategoryScores(riskFactors);

  const overallScore = Object.values(categories).reduce((sum, cat) => sum + cat.score, 0) / 4;
  const trendData: RiskTrend[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const variance = Math.random() * 10 - 5;
    const score = Math.max(0, Math.min(100, overallScore + variance + i * 0.2));
    trendData.push({
      date: date.toISOString().split('T')[0],
      score,
      level: determineLevel(score),
    });
  }

  const recommendations = generateRecommendations(repositoryId, categories);

  return {
    repositoryId,
    repositoryName,
    overallScore: calculateSeverityScore(overallScore),
    overallLevel: determineLevel(overallScore),
    categories,
    riskFactors,
    trendData,
    lastUpdated: now.toISOString(),
    recommendations,
  };
}

export function calculatePortfolioRisk(repositories: RepositoryRisk[]): RiskPortfolio {
  const repositoriesByLevel: Record<RiskLevel, string[]> = {
    low: [],
    medium: [],
    high: [],
    critical: [],
  };

  let totalScore = 0;
  const criticalRisks: RiskFactor[] = [];

  repositories.forEach((repo) => {
    repositoriesByLevel[repo.overallLevel].push(repo.repositoryName);
    totalScore += repo.overallScore;
    criticalRisks.push(...repo.riskFactors.filter((f) => f.level === 'critical'));
  });

  const trend: RiskTrend[] = [];
  const avgScore = repositories.length > 0 ? totalScore / repositories.length : 0;
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    trend.push({
      date: date.toISOString().split('T')[0],
      score: avgScore,
      level: determineLevel(avgScore),
    });
  }

  return {
    totalRepositories: repositories.length,
    averageRiskScore: avgScore,
    repositoriesByLevel,
    criticalRisks: criticalRisks.slice(0, 10),
    trend,
  };
}

export { calculateSeverityScore, determineLevel };
