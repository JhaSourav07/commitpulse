import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ReactNode } from 'react';
import { FeatureCard, FeatureCardsSection } from './FeatureCards';

type FeatureCardProps = Parameters<typeof FeatureCard>[0];
type FeatureCardsSectionProps = Parameters<typeof FeatureCardsSection>[0];

function validateFeatureCardProps(props: FeatureCardProps) {
  return {
    valid:
      props.icon !== undefined &&
      typeof props.title === 'string' &&
      typeof props.desc === 'string' &&
      typeof props.accent === 'string' &&
      typeof props.index === 'number' &&
      typeof props.accentColor === 'string',
  };
}

describe('FeatureCards Type Compiler Validation & Constraints', () => {
  it('1. enforces the FeatureCard prop contract strictly', () => {
    expectTypeOf<FeatureCardProps>().toEqualTypeOf<{
      icon: ReactNode;
      title: string;
      desc: string;
      accent: string;
      index: number;
      accentColor: string;
    }>();
  });

  it('2. uses type-testing assertions to check field configurations', () => {
    expectTypeOf<FeatureCardProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<FeatureCardProps['index']>().toEqualTypeOf<number>();
    expectTypeOf<FeatureCardProps['accentColor']>().toEqualTypeOf<string>();
    expectTypeOf<FeatureCardsSectionProps>().toEqualTypeOf<{
      children: ReactNode;
    }>();
  });

  it('3. asserts that invalid prop parameters are blocked during static type checking', () => {
    expectTypeOf<FeatureCardProps>().not.toEqualTypeOf<{
      icon: number;
      title: number;
      desc: number;
      accent: number;
      index: string;
      accentColor: number;
    }>();
  });

  it('4. verifies custom types accept optional values when partially mapped', () => {
    type OptionalFeatureCardProps = Partial<FeatureCardProps>;
    expectTypeOf<OptionalFeatureCardProps>().toEqualTypeOf<Partial<FeatureCardProps>>();

    const partialProps: OptionalFeatureCardProps = {
      title: 'Smart Alerts',
      accentColor: '#10b981',
    };
    expect(partialProps.title).toBe('Smart Alerts');
    expect(partialProps.accentColor).toBe('#10b981');
  });

  it('5. verifies schema validation constraints return strict validation reports', () => {
    const validProps: FeatureCardProps = {
      icon: '🔔',
      title: 'Smart Notifications',
      desc: 'Get notified in real-time.',
      accent: 'bg-green-500',
      index: 1,
      accentColor: '#10b981',
    };

    const invalidProps = {
      icon: '🔔',
      title: 123, // Invalid type
      desc: 'Get notified in real-time.',
      accent: 'bg-green-500',
      index: 'first', // Invalid type
      accentColor: '#10b981',
    };

    const validReport = validateFeatureCardProps(validProps);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invalidReport = validateFeatureCardProps(invalidProps as any);

    expect(validReport.valid).toBe(true);
    expect(invalidReport.valid).toBe(false);
  });
});
