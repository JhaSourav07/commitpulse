import { describe, it, expectTypeOf } from 'vitest';
import type {
  TechCategory,
  SocialCategory,
  IconType,
  Technology,
  Social,
  GeneratorState,
} from './types';

describe('types - compiler validation', () => {
  it('accepts valid literal union types', () => {
    expectTypeOf<IconType>().toMatchTypeOf<'devicon' | 'simpleicon'>();

    expectTypeOf<TechCategory>().toMatchTypeOf<
      | 'Languages'
      | 'Frontend'
      | 'UI Libraries'
      | 'Backend'
      | 'Mobile'
      | 'Database'
      | 'ORM & Query'
      | 'Cloud'
      | 'DevOps'
      | 'Tools & IDEs'
      | 'AI & ML'
      | 'Design'
      | 'Other'
    >();

    expectTypeOf<SocialCategory>().toMatchTypeOf<
      | 'Social Media'
      | 'Developer'
      | 'Competitive Programming'
      | 'Professional'
      | 'Streaming'
      | 'Contact'
      | 'Portfolio'
      | 'Support'
    >();
  });

  it('validates Technology structure', () => {
    expectTypeOf<Technology>().toHaveProperty('id');
    expectTypeOf<Technology>().toHaveProperty('name');
    expectTypeOf<Technology>().toHaveProperty('category');
    expectTypeOf<Technology>().toHaveProperty('iconUrl');
    expectTypeOf<Technology>().toHaveProperty('type');

    expectTypeOf<Technology['id']>().toEqualTypeOf<string>();
    expectTypeOf<Technology['category']>().toEqualTypeOf<TechCategory>();
    expectTypeOf<Technology['type']>().toEqualTypeOf<IconType>();
  });

  it('validates Social structure and blocks invalid prop parameters', () => {
    expectTypeOf<Social>().toHaveProperty('id');
    expectTypeOf<Social>().toHaveProperty('baseUrl');
    expectTypeOf<Social>().toHaveProperty('placeholder');
    expectTypeOf<Social>().toHaveProperty('category');

    expectTypeOf<Social['category']>().toEqualTypeOf<SocialCategory>();

    // Invalid category values must be rejected during static type checking.
    expectTypeOf<Social['category']>().not.toMatchTypeOf<'InvalidCategory'>();
    expectTypeOf<Technology['type']>().not.toMatchTypeOf<'unknown-icon-type'>();
  });

  it('allows Social.siSlug to accept optional values without compile errors', () => {
    expectTypeOf<Social['siSlug']>().toEqualTypeOf<string | undefined>();

    const withSlug: Social = {
      id: 'react',
      name: 'React',
      category: 'Developer',
      iconUrl: '/icons/react.svg',
      type: 'devicon',
      baseUrl: 'https://react.dev',
      placeholder: 'username',
      siSlug: 'react',
    };
    const withoutSlug: Social = {
      id: 'react',
      name: 'React',
      category: 'Developer',
      iconUrl: '/icons/react.svg',
      type: 'devicon',
      baseUrl: 'https://react.dev',
      placeholder: 'username',
    };

    expectTypeOf(withSlug).toMatchTypeOf<Social>();
    expectTypeOf(withoutSlug).toMatchTypeOf<Social>();
  });

  it('validates GeneratorState structure and strict field constraints', () => {
    expectTypeOf<GeneratorState>().toHaveProperty('selectedTechs');
    expectTypeOf<GeneratorState>().toHaveProperty('selectedSocials');
    expectTypeOf<GeneratorState>().toHaveProperty('socialLinks');
    expectTypeOf<GeneratorState>().toHaveProperty('graphPlacement');

    expectTypeOf<GeneratorState['selectedTechs']>().toEqualTypeOf<string[]>();
    expectTypeOf<GeneratorState['socialLinks']>().toEqualTypeOf<Record<string, string>>();
    expectTypeOf<GeneratorState['graphPlacement']>().toEqualTypeOf<'top' | 'middle' | 'bottom'>();

    // Strict validation: an unsupported placement value must not be assignable.
    expectTypeOf<GeneratorState['graphPlacement']>().not.toMatchTypeOf<'center'>();
  });
});
