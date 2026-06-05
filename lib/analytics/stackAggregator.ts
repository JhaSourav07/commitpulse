/**
 * Stack Analytics Aggregator
 *
 * Aggregates developer contributions by technology stack (languages/frameworks)
 * and generates stack-wise statistics for visualization.
 */

import type { RepoContribution, ContributionDay } from '@/types';
import { LANGUAGE_COLORS } from '@/lib/svg/languageColors';

export interface TechStackStats {
  language: string;
  color: string;
  contributionCount: number;
  percentage: number;
  dominanceRank: number;
}

export interface StackAnalytics {
  totalContributions: number;
  dominantStack: string;
  dominantStackColor: string;
  topStacks: TechStackStats[];
  stackBreakdown: Map<string, TechStackStats>;
  lastUpdated: string;
}

/**
 * Aggregates repository language contributions from commit data
 */
export function aggregateStackContributions(
  repoContributions: RepoContribution[]
): Map<string, number> {
  const stackMap = new Map<string, number>();

  for (const repo of repoContributions) {
    const language = repo.repository?.primaryLanguage?.name || 'Other';
    const count = repo.contributions?.totalCount || 0;

    if (count > 0) {
      const current = stackMap.get(language) || 0;
      stackMap.set(language, current + count);
    }
  }

  return stackMap;
}

/**
 * Gets the color for a given language/technology
 */
export function getStackColor(language: string): string {
  return LANGUAGE_COLORS[language] || '#858585'; // Gray as fallback
}

/**
 * Analyzes repository language distribution and generates stack statistics
 */
export function generateStackAnalytics(
  repoContributions: RepoContribution[],
  totalContributions: number
): StackAnalytics {
  const stackMap = aggregateStackContributions(repoContributions);

  // Convert to sorted array
  const stackEntries = Array.from(stackMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10 languages

  // Create detailed stats
  const topStacks: TechStackStats[] = stackEntries.map(([language, count], index) => ({
    language,
    color: getStackColor(language),
    contributionCount: count,
    percentage: totalContributions > 0 ? (count / totalContributions) * 100 : 0,
    dominanceRank: index + 1,
  }));

  // Get dominant stack
  const dominantStack = topStacks[0]?.language || 'Unknown';
  const dominantStackColor = topStacks[0]?.color || '#858585';

  // Create breakdown map for O(1) lookups
  const stackBreakdown = new Map<string, TechStackStats>(
    topStacks.map((stat) => [stat.language, stat])
  );

  return {
    totalContributions,
    dominantStack,
    dominantStackColor,
    topStacks,
    stackBreakdown,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Maps contribution days to their corresponding stack colors if available
 * This allows color-coding towers based on dominant tech stack per time period
 */
export function mapDaysToStackColors(
  days: ContributionDay[],
  stackAnalytics: StackAnalytics
): Map<string, string> {
  const dayColorMap = new Map<string, string>();

  // For MVP: all days get the dominant stack color
  // Future enhancement: could track language changes per day using git history
  for (const day of days) {
    dayColorMap.set(day.date, stackAnalytics.dominantStackColor);
  }

  return dayColorMap;
}

/**
 * Formats stack analytics for human-readable legend display
 */
export function formatStackLegend(analytics: StackAnalytics, maxItems: number = 5): string[] {
  return analytics.topStacks
    .slice(0, maxItems)
    .map(
      (stat) =>
        `${stat.language}: ${stat.contributionCount} contributions (${stat.percentage.toFixed(1)}%)`
    );
}

/**
 * Validates if stack analytics should be applied based on data quality
 */
export function shouldApplyStackColoring(analytics: StackAnalytics): boolean {
  // Only apply if we have meaningful language distribution
  return analytics.topStacks.length > 0 && analytics.dominantStack !== 'Other';
}
