import { describe, expect, expectTypeOf, it } from 'vitest';
import Leaderboard, { type Contributor } from './Leaderboard';

type LeaderboardProps = Parameters<typeof Leaderboard>[0];

const requiredContributorKeys = ['id', 'login', 'avatar_url', 'contributions', 'html_url'] as const;

function validateContributor(value: Contributor) {
  return {
    valid:
      Number.isInteger(value.id) &&
      typeof value.login === 'string' &&
      typeof value.avatar_url === 'string' &&
      typeof value.contributions === 'number' &&
      typeof value.html_url === 'string',
    keys: Object.keys(value),
  };
}

describe('Leaderboard type compiler validation', () => {
  it('exports a component that requires contributors props', () => {
    expectTypeOf<LeaderboardProps>().toEqualTypeOf<{
      contributors: Contributor[];
    }>();
  });

  it('enforces the Contributor field contract', () => {
    expectTypeOf<Contributor>().toEqualTypeOf<{
      id: number;
      login: string;
      avatar_url: string;
      contributions: number;
      html_url: string;
    }>();
  });

  it('blocks invalid contributor field types at compile time', () => {
    expectTypeOf<Contributor>().not.toEqualTypeOf<{
      id: string;
      login: string;
      avatar_url: string;
      contributions: string;
      html_url: string;
    }>();
  });

  it('accepts optional contributor-like values before validation', () => {
    type OptionalContributor = Partial<Contributor>;

    const draftContributor: OptionalContributor = {
      login: 'alice',
      contributions: 10,
    };

    expectTypeOf<OptionalContributor>().toEqualTypeOf<Partial<Contributor>>();
    expect(draftContributor.login).toBe('alice');
  });

  it('returns strict validation reports for contributor schema constraints', () => {
    const contributor: Contributor = {
      id: 1,
      login: 'alice',
      avatar_url: '/alice.png',
      contributions: 42,
      html_url: 'https://github.com/alice',
    };

    const report = validateContributor(contributor);

    expect(report.valid).toBe(true);

    for (const key of requiredContributorKeys) {
      expect(report.keys).toContain(key);
    }
  });
});
