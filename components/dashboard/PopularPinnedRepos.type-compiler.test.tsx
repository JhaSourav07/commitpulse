import { describe, expectTypeOf, it } from 'vitest';
import { PopularRepos } from './PopularPinnnedRepos';

type PopularReposProps = React.ComponentProps<typeof PopularRepos>;

interface Repository {
  name: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  url: string;
  primaryLanguage: {
    name: string;
    color: string;
  } | null;
  updatedAt?: string;
}

describe('PopularRepos Type Compiler Validation', () => {
  it('supports optional popularRepos prop', () => {
    expectTypeOf<PopularReposProps['popularRepos']>().toEqualTypeOf<Repository[] | undefined>();
  });

  it('supports optional pinnedRepos prop', () => {
    expectTypeOf<PopularReposProps['pinnedRepos']>().toEqualTypeOf<Repository[] | undefined>();
  });

  it('supports optional starredRepos prop', () => {
    expectTypeOf<PopularReposProps['starredRepos']>().toEqualTypeOf<Repository[] | undefined>();
  });

  it('accepts a valid props object', () => {
    const props: PopularReposProps = {
      popularRepos: [],
      pinnedRepos: [],
      starredRepos: [],
    };

    expectTypeOf(props).toMatchTypeOf<PopularReposProps>();
  });

  it('exports PopularRepos as a callable React component', () => {
    expectTypeOf(PopularRepos).toBeFunction();
  });
});

// Compile-time validation checks

void ({
  // @ts-expect-error popularRepos must be Repository[]
  popularRepos: 'invalid',
} satisfies PopularReposProps);

void ({
  // @ts-expect-error pinnedRepos must be Repository[]
  pinnedRepos: 123,
} satisfies PopularReposProps);

void ({
  // @ts-expect-error starredRepos must be Repository[]
  starredRepos: false,
} satisfies PopularReposProps);
