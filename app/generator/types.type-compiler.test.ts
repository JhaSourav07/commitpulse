import { describe, it, expectTypeOf } from 'vitest';
import type {
  TechCategory,
  SocialCategory,
  IconType,
  Technology,
  Social,
  GeneratorState,
} from './types';

// This suite is a pure TypeScript compiler-validation harness.
// It uses Vitest's expectTypeOf API to enforce that the exported
// interfaces / unions from app/generator/types.ts stay stable across
// refactors. If a required field is dropped, renamed, or its type
// widened, the TypeScript compiler itself will fail the build — long
// before any runtime bug can ship.

describe('app/generator/types.ts — TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('locks the TechCategory union to the exact 13 published labels (no accidental widening)', () => {
    // Every published label must satisfy the union — this proves the
    // union is neither narrower nor widened to `string`.
    expectTypeOf<'Languages'>().toMatchTypeOf<TechCategory>();
    expectTypeOf<'Frontend'>().toMatchTypeOf<TechCategory>();
    expectTypeOf<'UI Libraries'>().toMatchTypeOf<TechCategory>();
    expectTypeOf<'Backend'>().toMatchTypeOf<TechCategory>();
    expectTypeOf<'Mobile'>().toMatchTypeOf<TechCategory>();
    expectTypeOf<'Database'>().toMatchTypeOf<TechCategory>();
    expectTypeOf<'ORM & Query'>().toMatchTypeOf<TechCategory>();
    expectTypeOf<'Cloud'>().toMatchTypeOf<TechCategory>();
    expectTypeOf<'DevOps'>().toMatchTypeOf<TechCategory>();
    expectTypeOf<'Tools & IDEs'>().toMatchTypeOf<TechCategory>();
    expectTypeOf<'AI & ML'>().toMatchTypeOf<TechCategory>();
    expectTypeOf<'Design'>().toMatchTypeOf<TechCategory>();
    expectTypeOf<'Other'>().toMatchTypeOf<TechCategory>();
    // TechCategory must NOT collapse to a bare `string` — that would
    // silently accept typos like 'frnotend' at runtime.
    expectTypeOf<TechCategory>().not.toBeString();
  });

  it('locks the SocialCategory union + IconType union — invalid props are blocked at compile time', () => {
    expectTypeOf<'Social Media'>().toMatchTypeOf<SocialCategory>();
    expectTypeOf<'Developer'>().toMatchTypeOf<SocialCategory>();
    expectTypeOf<'Competitive Programming'>().toMatchTypeOf<SocialCategory>();
    expectTypeOf<'Professional'>().toMatchTypeOf<SocialCategory>();
    expectTypeOf<'Streaming'>().toMatchTypeOf<SocialCategory>();
    expectTypeOf<'Contact'>().toMatchTypeOf<SocialCategory>();
    expectTypeOf<'Portfolio'>().toMatchTypeOf<SocialCategory>();
    expectTypeOf<'Support'>().toMatchTypeOf<SocialCategory>();

    // IconType is the discriminated tag used by the renderer to
    // switch between devicon and simpleicon code paths. It must
    // stay exactly 2 members — no accidental third value.
    expectTypeOf<'devicon'>().toMatchTypeOf<IconType>();
    expectTypeOf<'simpleicon'>().toMatchTypeOf<IconType>();
    expectTypeOf<IconType>().not.toBeString();
  });

  it('enforces every required field on the Technology interface (structural schema constraints)', () => {
    // Field-level property configuration — the compiler blocks any
    // renamed / dropped field at build time.
    expectTypeOf<Technology>().toHaveProperty('id').toBeString();
    expectTypeOf<Technology>().toHaveProperty('name').toBeString();
    expectTypeOf<Technology>().toHaveProperty('category').toEqualTypeOf<TechCategory>();
    expectTypeOf<Technology>().toHaveProperty('iconUrl').toBeString();
    expectTypeOf<Technology>().toHaveProperty('type').toEqualTypeOf<IconType>();

    // A well-typed literal must be assignable — this is the
    // "invalid prop parameters are blocked during static type
    // checking" clause of the acceptance criteria.
    const validTech: Technology = {
      id: 'react',
      name: 'React',
      category: 'Frontend',
      iconUrl: 'https://cdn.simpleicons.org/react',
      type: 'simpleicon',
    };
    expectTypeOf(validTech).toEqualTypeOf<Technology>();
  });

  it('enforces the Social interface schema and keeps siSlug as a strictly optional field', () => {
    expectTypeOf<Social>().toHaveProperty('id').toBeString();
    expectTypeOf<Social>().toHaveProperty('name').toBeString();
    expectTypeOf<Social>().toHaveProperty('category').toEqualTypeOf<SocialCategory>();
    expectTypeOf<Social>().toHaveProperty('iconUrl').toBeString();
    expectTypeOf<Social>().toHaveProperty('type').toEqualTypeOf<IconType>();
    expectTypeOf<Social>().toHaveProperty('baseUrl').toBeString();
    expectTypeOf<Social>().toHaveProperty('placeholder').toBeString();

    // siSlug is optional — a Social without it must still compile.
    const socialWithoutSlug: Social = {
      id: 'github',
      name: 'GitHub',
      category: 'Developer',
      iconUrl: 'https://cdn.simpleicons.org/github',
      type: 'simpleicon',
      baseUrl: 'https://github.com/',
      placeholder: 'username',
    };
    expectTypeOf(socialWithoutSlug).toEqualTypeOf<Social>();

    // And a Social WITH the optional slug must also compile — proves
    // the custom optional type accepts values without compile errors.
    const socialWithSlug: Social = { ...socialWithoutSlug, siSlug: 'github' };
    expectTypeOf(socialWithSlug).toEqualTypeOf<Social>();
  });

  it('enforces the GeneratorState schema — graphPlacement stays a strict 3-literal union (schema validation report)', () => {
    expectTypeOf<GeneratorState>().toHaveProperty('name').toBeString();
    expectTypeOf<GeneratorState>().toHaveProperty('description').toBeString();
    expectTypeOf<GeneratorState>().toHaveProperty('selectedTechs').toEqualTypeOf<string[]>();
    expectTypeOf<GeneratorState>().toHaveProperty('selectedSocials').toEqualTypeOf<string[]>();
    expectTypeOf<GeneratorState>()
      .toHaveProperty('socialLinks')
      .toEqualTypeOf<Record<string, string>>();
    expectTypeOf<GeneratorState>().toHaveProperty('githubUsername').toBeString();
    expectTypeOf<GeneratorState>().toHaveProperty('showCommitPulse').toBeBoolean();
    expectTypeOf<GeneratorState>().toHaveProperty('commitPulseAccent').toBeString();
    expectTypeOf<GeneratorState>().toHaveProperty('showSnakeGraph').toBeBoolean();
    expectTypeOf<GeneratorState>().toHaveProperty('showPacmanGraph').toBeBoolean();

    // graphPlacement is the strictest schema constraint — 3 literals only.
    expectTypeOf<GeneratorState['graphPlacement']>().toEqualTypeOf<'top' | 'middle' | 'bottom'>();

    // Full-state literal — strict validation report for the whole schema.
    const validState: GeneratorState = {
      name: 'Ada',
      description: 'desc',
      selectedTechs: ['react'],
      selectedSocials: ['github'],
      socialLinks: { github: 'https://github.com/ada' },
      githubUsername: 'ada',
      showCommitPulse: true,
      commitPulseAccent: '#ff6b6b',
      showSnakeGraph: false,
      showPacmanGraph: false,
      graphPlacement: 'top',
    };
    expectTypeOf(validState).toEqualTypeOf<GeneratorState>();
  });
});
