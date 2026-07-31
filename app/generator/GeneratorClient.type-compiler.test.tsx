import { describe, expectTypeOf, it } from 'vitest';
import { GeneratorClient } from './GeneratorClient';
import type {
  GeneratorState,
  Technology,
  Social,
  TechCategory,
  SocialCategory,
  IconType,
} from './types';
import type {
  GitHubUser,
  GitHubRepo,
  GitHubSocialAccount,
  ImportedData,
} from './utils/githubMapper';
import { mapGitHubData } from './utils/githubMapper';

describe('GeneratorClient TypeScript Compiler Validation', () => {
  // 1. Use type-testing assertions (expectTypeOf) to enforce field property configurations.
  it('enforces field property configurations of GeneratorState', () => {
    expectTypeOf<GeneratorState['name']>().toEqualTypeOf<string>();
    expectTypeOf<GeneratorState['description']>().toEqualTypeOf<string>();
    expectTypeOf<GeneratorState['selectedTechs']>().toEqualTypeOf<string[]>();
    expectTypeOf<GeneratorState['selectedSocials']>().toEqualTypeOf<string[]>();
    expectTypeOf<GeneratorState['socialLinks']>().toEqualTypeOf<Record<string, string>>();
    expectTypeOf<GeneratorState['githubUsername']>().toEqualTypeOf<string>();
    expectTypeOf<GeneratorState['showCommitPulse']>().toEqualTypeOf<boolean>();
    expectTypeOf<GeneratorState['commitPulseAccent']>().toEqualTypeOf<string>();
    expectTypeOf<GeneratorState['showRepoSpotlight']>().toEqualTypeOf<boolean>();
    expectTypeOf<GeneratorState['spotlightRepo']>().toEqualTypeOf<string>();
    expectTypeOf<GeneratorState['showSnakeGraph']>().toEqualTypeOf<boolean>();
    expectTypeOf<GeneratorState['showPacmanGraph']>().toEqualTypeOf<boolean>();
    expectTypeOf<GeneratorState['graphPlacement']>().toEqualTypeOf<'top' | 'middle' | 'bottom'>();
  });

  // 2. Assert that invalid prop parameters are blocked during static type checking.
  it('blocks invalid prop parameters during static type checking', () => {
    // GeneratorClient has no props
    expectTypeOf(GeneratorClient).toBeFunction();

    void ({
      name: 'John Doe',
      description: 'Bio details',
      selectedTechs: [],
      selectedSocials: [],
      socialLinks: {},
      githubUsername: 'john',
      showCommitPulse: true,
      commitPulseAccent: '#ff0000',
      showRepoSpotlight: false,
      spotlightRepo: '',
      showSnakeGraph: false,
      showPacmanGraph: false,
      // @ts-expect-error graphPlacement must be 'top' | 'middle' | 'bottom'
      graphPlacement: 'left',
    } satisfies GeneratorState);

    void ({
      name: 'John Doe',
      description: 'Bio details',
      // @ts-expect-error selectedTechs must be array of strings
      selectedTechs: 'react',
      selectedSocials: [],
      socialLinks: {},
      githubUsername: 'john',
      showCommitPulse: true,
      commitPulseAccent: '#ff0000',
      showRepoSpotlight: false,
      spotlightRepo: '',
      showSnakeGraph: false,
      showPacmanGraph: false,
      graphPlacement: 'top',
    } satisfies GeneratorState);
  });

  // 3. Verify custom types accept optional/nullable values without compile errors.
  it('verifies custom GitHub data types accept optional/nullable values without compile errors', () => {
    const user: GitHubUser = {
      name: null,
      bio: null,
      blog: null,
      twitter_username: null,
      email: null,
    };

    expectTypeOf(user.name).toEqualTypeOf<string | null>();
    expectTypeOf(user.bio).toEqualTypeOf<string | null>();
  });

  // 4. Verify field configurations and types for Technology and Social interfaces.
  it('verifies Technology and Social interfaces and categories', () => {
    expectTypeOf<Technology['category']>().toEqualTypeOf<TechCategory>();
    expectTypeOf<Social['category']>().toEqualTypeOf<SocialCategory>();
    expectTypeOf<Technology['type']>().toEqualTypeOf<IconType>();
    expectTypeOf<Social['type']>().toEqualTypeOf<IconType>();
  });

  // 5. Verify schema validation constraints return strict validation reports.
  it('verifies parameter constraints and return shapes on mapGitHubData', () => {
    expectTypeOf(mapGitHubData).parameter(0).toEqualTypeOf<GitHubUser>();
    expectTypeOf(mapGitHubData).parameter(1).toEqualTypeOf<GitHubRepo[]>();
    expectTypeOf(mapGitHubData).parameter(2).toEqualTypeOf<GitHubSocialAccount[]>();
    expectTypeOf(mapGitHubData).returns.toEqualTypeOf<ImportedData>();

    // @ts-expect-error mapGitHubData parameter 0 must satisfy GitHubUser structure
    void mapGitHubData({ name: 123 }, [], []);
  });
});
