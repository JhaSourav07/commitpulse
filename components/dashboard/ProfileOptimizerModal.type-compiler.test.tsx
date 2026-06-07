import { describe, it, expectTypeOf } from 'vitest';

interface ProfileOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: any;
}

type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

interface Recommendation {
  priority: string;
  category: string;
  issue: string;
  recommendation: string;
  action: string;
  impact?: string;
}

interface Category {
  name: string;
  score: number;
  status: 'good' | 'average' | 'poor';
}

describe('ProfileOptimizerModal type-compiler: TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('enforces correct types on ProfileOptimizerModalProps fields', () => {
    expectTypeOf<ProfileOptimizerModalProps['isOpen']>().toEqualTypeOf<boolean>();
    expectTypeOf<ProfileOptimizerModalProps['onClose']>().toEqualTypeOf<() => void>();
    expectTypeOf<ProfileOptimizerModalProps['userData']>().toBeAny();
  });

  it('validates that Recommendation required fields are all typed as string', () => {
    expectTypeOf<Recommendation['priority']>().toEqualTypeOf<string>();
    expectTypeOf<Recommendation['category']>().toEqualTypeOf<string>();
    expectTypeOf<Recommendation['issue']>().toEqualTypeOf<string>();
    expectTypeOf<Recommendation['recommendation']>().toEqualTypeOf<string>();
    expectTypeOf<Recommendation['action']>().toEqualTypeOf<string>();
  });

  it('verifies Recommendation accepts optional impact field without compile errors', () => {
    expectTypeOf<Recommendation['impact']>().toEqualTypeOf<string | undefined>();

    const rec: Recommendation = {
      priority: 'HIGH',
      category: 'Bio & Details',
      issue: 'Bio is empty',
      recommendation: 'Add a bio',
      action: 'Update bio now',
    };
    expectTypeOf(rec).toEqualTypeOf<Recommendation>();

    const recWithImpact: Recommendation = {
      priority: 'MEDIUM',
      category: 'Portfolio Diversity',
      issue: 'Single language',
      recommendation: 'Add more languages',
      action: 'Pin diverse repos',
      impact: 'Improves recruiter impression',
    };
    expectTypeOf(recWithImpact).toEqualTypeOf<Recommendation>();
  });

  it('validates Category schema constraints enforce correct field types', () => {
    expectTypeOf<Category['name']>().toEqualTypeOf<string>();
    expectTypeOf<Category['score']>().toEqualTypeOf<number>();
    expectTypeOf<Category['status']>().toEqualTypeOf<'good' | 'average' | 'poor'>();

    const cat: Category = { name: 'Profile README', score: 85, status: 'good' };
    expectTypeOf(cat).toEqualTypeOf<Category>();
  });

  it('verifies RecommendationPriority union type only accepts HIGH, MEDIUM or LOW', () => {
    expectTypeOf<RecommendationPriority>().toEqualTypeOf<'HIGH' | 'MEDIUM' | 'LOW'>();
    expectTypeOf<'HIGH'>().toMatchTypeOf<RecommendationPriority>();
    expectTypeOf<'MEDIUM'>().toMatchTypeOf<RecommendationPriority>();
    expectTypeOf<'LOW'>().toMatchTypeOf<RecommendationPriority>();
  });
});
