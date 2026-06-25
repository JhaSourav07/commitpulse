import type {
  ExecutiveMetric,
  TeamCapacity,
  StrategicInitiative,
  EngineeringHealth,
  DeploymentMetrics,
  BusinessOutcome,
  ExecutiveReport,
  ExecutiveDashboardData,
  ExecutiveFilter,
} from '@/types/executive';

function generateExecutiveMetrics(): ExecutiveMetric[] {
  const metrics = [
    { id: 'velocity', name: 'Engineering Velocity', value: 127, unit: 'points/sprint', change: 12 },
    { id: 'throughput', name: 'Throughput', value: 45, unit: 'PRs/week', change: 8 },
    { id: 'quality', name: 'Code Quality Score', value: 94, unit: '%', change: 3 },
    { id: 'satisfaction', name: 'Team Satisfaction', value: 87, unit: '%', change: 5 },
    { id: 'deploy-freq', name: 'Deployment Frequency', value: 12, unit: 'deploys/day', change: 15 },
  ];

  return metrics.map((m) => ({
    id: m.id,
    name: m.name,
    value: m.value,
    previousValue: Math.round(m.value / (1 + m.change / 100)),
    unit: m.unit,
    trend: 'up' as const,
    changePercent: m.change,
  }));
}

function generateTeamCapacity(): TeamCapacity[] {
  const teams = [
    { id: 'team-alpha', name: 'Platform Team', velocity: 45 },
    { id: 'team-beta', name: 'Frontend Team', velocity: 38 },
    { id: 'team-gamma', name: 'Backend Team', velocity: 52 },
    { id: 'team-delta', name: 'DevOps Team', velocity: 28 },
  ];

  return teams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    members: Math.floor(Math.random() * 5) + 5,
    velocity: t.velocity + Math.floor(Math.random() * 10),
    capacity: 100,
    utilizationPercent: 75 + Math.floor(Math.random() * 20),
  }));
}

function generateInitiatives(): StrategicInitiative[] {
  const initiatives = [
    { name: 'Cloud Migration', status: 'on-track' as const, progress: 75 },
    { name: 'Security Enhancement', status: 'at-risk' as const, progress: 45 },
    { name: 'Performance Optimization', status: 'on-track' as const, progress: 90 },
    { name: 'API v2 Launch', status: 'delayed' as const, progress: 30 },
  ];

  return initiatives.map((init, i) => ({
    id: `init-${i + 1}`,
    name: init.name,
    progress: init.progress,
    status: init.status,
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    health: init.status === 'on-track' ? 85 : init.status === 'at-risk' ? 55 : 30,
    owner: ['Alice', 'Bob', 'Charlie', 'Diana'][i],
  }));
}

function generateEngineeringHealth(): EngineeringHealth {
  return {
    overallScore: 82,
    productivityScore: 85,
    qualityScore: 88,
    sustainabilityScore: 78,
    velocityScore: 80,
  };
}

function generateDeploymentMetrics(): DeploymentMetrics {
  return {
    frequency: 12,
    leadTime: 4,
    changeFailureRate: 2.5,
    meanTimeToRestore: 45,
  };
}

function generateBusinessOutcomes(): BusinessOutcome[] {
  return [
    { id: 'bo-1', metric: 'Customer Satisfaction', value: 87, target: 90, correlation: 0.85 },
    { id: 'bo-2', metric: 'Time to Market', value: 72, target: 80, correlation: 0.72 },
    { id: 'bo-3', metric: 'Operational Efficiency', value: 90, target: 85, correlation: 0.91 },
    { id: 'bo-4', metric: 'Developer Productivity', value: 78, target: 85, correlation: 0.88 },
  ];
}

function generateNaturalLanguageSummary(): string {
  return `Engineering organization shows strong performance this quarter with an overall health score of 82. Velocity increased by 12% compared to the previous period, indicating improved team productivity. Code quality remains high at 94%, demonstrating commitment to software excellence.`;
}

export function generateExecutiveDashboard(filter?: ExecutiveFilter): ExecutiveDashboardData {
  const currentReport: ExecutiveReport = {
    id: `report-${Date.now()}`,
    title: 'Engineering Executive Summary',
    generatedAt: new Date().toISOString(),
    period: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
    engineeringHealth: generateEngineeringHealth(),
    metrics: generateExecutiveMetrics(),
    teamCapacity: generateTeamCapacity(),
    initiatives: generateInitiatives(),
    deploymentMetrics: generateDeploymentMetrics(),
    businessOutcomes: generateBusinessOutcomes(),
    naturalLanguageSummary: generateNaturalLanguageSummary(),
  };

  const historicalTrends = Array.from({ length: 12 }, (_, i) => ({
    date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    healthScore: 75 + Math.floor(Math.random() * 15),
    velocity: 100 + Math.floor(Math.random() * 30),
  }));

  const comparisons = [
    { period: 'This Month', current: 82, previous: 78 },
    { period: 'Last Quarter', current: 82, previous: 75 },
  ];

  const alerts = [
    {
      id: 'alert-1',
      type: 'warning' as const,
      message: 'Security Enhancement initiative is at risk',
      timestamp: new Date().toISOString(),
    },
  ];

  return { currentReport, historicalTrends, comparisons, alerts };
}
