import { ActivityData } from '@/types/dashboard';

export interface ForecastResult {
  weeklyVelocity: number;
  monthlyVelocity: number;
  projectedMonthEndTotal: number;
  projectedYearEndTotal: number;
  consistencyScore: number;
  consistencyLevel: 'elite' | 'consistent' | 'occasional' | 'sporadic' | 'inactive';
  slope: number;
  trendType: 'strong_growth' | 'moderate_growth' | 'stable' | 'cooling' | 'decline';
  confidenceLower: number;
  confidenceUpper: number;
  hasActivity: boolean;
}

export function calculateForecast(
  activity: ActivityData[] = [],
  totalContributions?: number
): ForecastResult {
  if (!activity || activity.length === 0) {
    return {
      weeklyVelocity: 0,
      monthlyVelocity: 0,
      projectedMonthEndTotal: totalContributions || 0,
      projectedYearEndTotal: totalContributions || 0,
      consistencyScore: 0,
      consistencyLevel: 'inactive',
      slope: 0,
      trendType: 'stable',
      confidenceLower: totalContributions || 0,
      confidenceUpper: totalContributions || 0,
      hasActivity: false,
    };
  }

  const N = activity.length;
  const currentTotal =
    totalContributions !== undefined
      ? totalContributions
      : activity.reduce((sum, d) => sum + d.count, 0);

  // 1. Average Daily, Weekly, Monthly Velocity
  const totalActivityCommits = activity.reduce((sum, d) => sum + d.count, 0);
  const avgDaily = totalActivityCommits / N;
  const weeklyVelocity = avgDaily * 7;
  const monthlyVelocity = avgDaily * 30;

  // 2. Linear Regression (slope m and intercept c)
  const meanX = (N - 1) / 2;
  const meanY = totalActivityCommits / N;

  let num = 0;
  let den = 0;
  for (let i = 0; i < N; i++) {
    const xDiff = i - meanX;
    num += xDiff * (activity[i].count - meanY);
    den += xDiff * xDiff;
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;

  // 3. Date Projections
  const lastEntryDateStr = activity[N - 1].date;
  let currentDate = new Date(lastEntryDateStr);
  if (isNaN(currentDate.getTime())) {
    currentDate = new Date();
  }

  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const timeDiffMonth = endOfMonth.getTime() - currentDate.getTime();
  const daysRemainingInMonth = Math.max(0, Math.ceil(timeDiffMonth / (1000 * 60 * 60 * 24)));

  const endOfYear = new Date(currentDate.getFullYear(), 11, 31);
  const timeDiffYear = endOfYear.getTime() - currentDate.getTime();
  const daysRemainingInYear = Math.max(0, Math.ceil(timeDiffYear / (1000 * 60 * 60 * 24)));

  let projectedMonthExtra = 0;
  for (let d = 1; d <= daysRemainingInMonth; d++) {
    const projectedDaily = slope * (N - 1 + d) + intercept;
    projectedMonthExtra += Math.max(0, projectedDaily);
  }
  const projectedMonthEndTotal = Math.round(currentTotal + projectedMonthExtra);

  let projectedYearExtra = 0;
  for (let d = 1; d <= daysRemainingInYear; d++) {
    const projectedDaily = slope * (N - 1 + d) + intercept;
    projectedYearExtra += Math.max(0, projectedDaily);
  }
  const projectedYearEndTotal = Math.round(currentTotal + projectedYearExtra);

  // 4. Consistency Score
  const activeDays = activity.filter((d) => d.count > 0).length;
  const activeRatio = activeDays / N;
  const consistencyScore = Math.min(100, Math.round(activeRatio * 100));

  let consistencyLevel: ForecastResult['consistencyLevel'] = 'inactive';
  if (consistencyScore >= 85) consistencyLevel = 'elite';
  else if (consistencyScore >= 60) consistencyLevel = 'consistent';
  else if (consistencyScore >= 30) consistencyLevel = 'occasional';
  else if (consistencyScore > 0) consistencyLevel = 'sporadic';

  // 5. Trend slope categorization
  let trendType: ForecastResult['trendType'] = 'stable';
  if (slope > 0.02) trendType = 'strong_growth';
  else if (slope > 0.005) trendType = 'moderate_growth';
  else if (slope < -0.02) trendType = 'decline';
  else if (slope < -0.005) trendType = 'cooling';

  // Calculate Variance for Confidence Bounds
  let varianceSum = 0;
  for (let i = 0; i < N; i++) {
    const expected = slope * i + intercept;
    varianceSum += Math.pow(activity[i].count - expected, 2);
  }
  const stdDev = Math.sqrt(varianceSum / N);

  // Bounds for Year End (using basic standard error projection)
  const confidenceLower = Math.max(
    currentTotal,
    Math.round(projectedYearEndTotal - 1.96 * stdDev * Math.sqrt(daysRemainingInYear))
  );
  const confidenceUpper = Math.round(
    projectedYearEndTotal + 1.96 * stdDev * Math.sqrt(daysRemainingInYear)
  );

  return {
    weeklyVelocity,
    monthlyVelocity,
    projectedMonthEndTotal,
    projectedYearEndTotal,
    consistencyScore,
    consistencyLevel,
    slope,
    trendType,
    confidenceLower,
    confidenceUpper,
    hasActivity: true,
  };
}
