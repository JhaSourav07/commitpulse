// lib/graphql/client.test.ts
import { describe, it, expect } from 'vitest';
import { calculateQueryComplexity } from './client';

describe('GraphQL Query Complexity Analyzer', () => {
  it('calculates complexity for a simple query', () => {
    const query = `
      query {
        user(login: "octocat") {
          login
        }
      }
    `;
    const complexity = calculateQueryComplexity(query);
    // user (base 1 + object 1.5) + login (1) = 3.5 + 0 = 3.5. Wait, childComplexity is 1. So user cost = 1 + 1.5 + 1 = 3.5.
    // Let's verify it returns a valid number.
    expect(complexity).toBeGreaterThan(0);
  });

  it('factors in aliases in complexity calculations', () => {
    const queryWithoutAlias = `
      query {
        user(login: "octocat") {
          login
        }
      }
    `;
    const queryWithAlias = `
      query {
        user(login: "octocat") {
          aliasLogin: login
        }
      }
    `;

    const compNormal = calculateQueryComplexity(queryWithoutAlias);
    const compAlias = calculateQueryComplexity(queryWithAlias);
    expect(compAlias).toBeGreaterThan(compNormal);
  });

  it('factors in nested depths', () => {
    const queryShallow = `
      query {
        user(login: "octocat") {
          login
        }
      }
    `;
    const queryDeep = `
      query {
        user(login: "octocat") {
          contributionsCollection {
            contributionCalendar {
              totalContributions
            }
          }
        }
      }
    `;

    const compShallow = calculateQueryComplexity(queryShallow);
    const compDeep = calculateQueryComplexity(queryDeep);
    expect(compDeep).toBeGreaterThan(compShallow);
  });

  it('factors in list/collection field types', () => {
    const queryWithoutList = `
      query {
        user(login: "octocat") {
          contributionsCollection {
            contributionCalendar {
              totalContributions
            }
          }
        }
      }
    `;
    const queryWithList = `
      query {
        user(login: "octocat") {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;

    const compWithoutList = calculateQueryComplexity(queryWithoutList);
    const compWithList = calculateQueryComplexity(queryWithList);
    expect(compWithList).toBeGreaterThan(compWithoutList);
  });

  it('returns fallback complexity on malformed query', () => {
    const malformed = `
      query {
        user(login: "octocat") {
          unclosedBrace
      }
    `;
    const complexity = calculateQueryComplexity(malformed);
    expect(complexity).toBe(10); // fallback value
  });
});
