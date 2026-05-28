// lib/graphql/client.ts
import { buildSchema, parse } from 'graphql';
import {
  getComplexity,
  simpleEstimator,
  ComplexityEstimator,
  ComplexityEstimatorArgs,
} from 'graphql-query-complexity';

export const CONTRIBUTIONS_QUERY = `
  query($login: String!, $from: DateTime, $to: DateTime) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              color
            }
          }
        }
      }
    }
  }
`;

// Simplified schema of the GitHub GraphQL API subset used by CommitPulse
export const githubSchema = buildSchema(`
  scalar DateTime

  type Query {
    user(login: String!): User
    rateLimit(dryRun: Boolean): RateLimit
  }

  type RateLimit {
    limit: Int!
    cost: Int!
    remaining: Int!
    resetAt: DateTime!
  }

  type User {
    login: String!
    name: String
    contributionsCollection(from: DateTime, to: DateTime): ContributionsCollection!
  }

  type ContributionsCollection {
    contributionCalendar: ContributionCalendar!
  }

  type ContributionCalendar {
    totalContributions: Int!
    weeks: [ContributionWeek!]!
  }

  type ContributionWeek {
    contributionDays: [ContributionDay!]!
  }

  type ContributionDay {
    contributionCount: Int!
    date: String!
    color: String!
  }
`);

/**
 * Custom estimator for query complexity.
 * Factors in:
 * - Base field costs
 * - Aliases: adding extra weight since they multiply data extraction paths
 * - Field types: list/connection types multiply the child complexity
 * - Nested depths: deeper fields add progressive depth cost
 */
export const costEstimator: ComplexityEstimator = (options: ComplexityEstimatorArgs) => {
  const { field, childComplexity, node } = options;

  // 1. Base Cost
  let baseCost = 1;

  // 2. Alias detection
  if (node && node.alias) {
    baseCost += 2; // Aliased fields add processing overhead
  }

  // 3. Field type checks
  const fieldTypeStr = field.type.toString();
  const isList = fieldTypeStr.includes('[') || fieldTypeStr.includes('Connection');
  const isObject =
    !isList &&
    (fieldTypeStr.includes('User') ||
      fieldTypeStr.includes('Collection') ||
      fieldTypeStr.includes('Calendar') ||
      fieldTypeStr.includes('Week'));

  if (isList) {
    // Determine multiplication factor. If from/to are provided, we estimate the number of days.
    // In our contribution queries, we might not have 'first'/'last', but we have weeks/days.
    // Let's use parameters if available, or a default list size.
    let listSize = 10; // default list multiplier
    if (field.name === 'weeks') {
      listSize = 53; // ~53 weeks in a year
    } else if (field.name === 'contributionDays') {
      listSize = 7; // 7 days in a week
    }

    // Multiply child complexity by the collection size
    return baseCost + listSize * childComplexity;
  }

  if (isObject) {
    baseCost += 1.5; // object fields have nested structures
  }

  // Return base cost plus nested child complexity
  return baseCost + childComplexity;
};

/**
 * Calculates the complexity of a GraphQL query.
 * @param query The GraphQL query string
 * @param variables Optional variables dictionary
 */
export function calculateQueryComplexity(
  query: string,
  variables: Record<string, unknown> = {}
): number {
  try {
    const document = parse(query);
    const complexity = getComplexity({
      schema: githubSchema,
      query: document,
      variables,
      estimators: [costEstimator, simpleEstimator({ defaultComplexity: 1 })],
    });
    return complexity;
  } catch (error) {
    console.error('Error calculating query complexity:', error);
    // Fallback to a default complexity if parsing fails, to avoid breaking the application
    return 10;
  }
}
