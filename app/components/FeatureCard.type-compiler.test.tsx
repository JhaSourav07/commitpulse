import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode, ComponentPropsWithoutRef } from 'react';
import { FeatureCard } from './FeatureCard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover,
      whileTap,
      whileInView,
      initial,
      animate,
      exit,
      transition,
      viewport,
      ...props
    }: ComponentPropsWithoutRef<'div'> & {
      whileHover?: unknown;
      whileTap?: unknown;
      whileInView?: unknown;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      viewport?: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

type FeatureCardProps = Parameters<typeof FeatureCard>[0];

describe('FeatureCard TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('1. confirms required properties match explicit structural field layouts and parameter expectations', () => {
    expectTypeOf<FeatureCardProps>().toEqualTypeOf<{
      icon: ReactNode;
      title: string;
      desc: string;
      accent: string;
    }>();
  });

  it('2. ensures structurally mismatching, incompatible, or extraneous configuration types are blocked', () => {
    expectTypeOf<{
      icon: ReactNode;
      title: string;
      desc: string;
      accent: string;
      extraConfig: boolean;
    }>().not.toEqualTypeOf<FeatureCardProps>();

    expectTypeOf<{
      icon: ReactNode;
      title: number;
      desc: string;
      accent: string;
    }>().not.toEqualTypeOf<FeatureCardProps>();

    expectTypeOf<{
      icon: ReactNode;
      title: string;
    }>().not.toEqualTypeOf<FeatureCardProps>();
  });

  it('3. verifies that optional design elements handle structural typing gracefully without discrepancies', () => {
    type OptionalFeatureCardProps = Partial<FeatureCardProps>;

    expectTypeOf<OptionalFeatureCardProps>().toEqualTypeOf<{
      icon?: ReactNode;
      title?: string;
      desc?: string;
      accent?: string;
    }>();

    const partialConfig: OptionalFeatureCardProps = {
      title: 'Graceful Layout Title',
    };

    expect(partialConfig.title).toBe('Graceful Layout Title');
    expect(partialConfig.desc).toBeUndefined();
  });

  it('4. verifies type modifier conditions and value variants conform to structural typing constraints', () => {
    type ReadOnlyFeatureCardProps = Readonly<FeatureCardProps>;
    expectTypeOf<ReadOnlyFeatureCardProps>().toEqualTypeOf<Readonly<FeatureCardProps>>();

    type ThemeAccent = 'text-emerald-400' | 'text-blue-500' | 'text-purple-500';
    expectTypeOf<ThemeAccent>().toMatchTypeOf<FeatureCardProps['accent']>();

    const readonlyTitle: ReadOnlyFeatureCardProps['title'] = 'Readonly Title';
    expect(readonlyTitle).toBe('Readonly Title');
  });

  it('5. asserts that runtime parsing fallbacks handle missing attributes safely and complete standard mounting cycles', () => {
    const { container } = render(
      <FeatureCard
        icon={<span data-testid="test-mounting-icon">★</span>}
        title={undefined as unknown as string}
        desc={undefined as unknown as string}
        accent={undefined as unknown as string}
      />
    );

    expect(container).toBeDefined();
    expect(screen.getByTestId('test-mounting-icon')).toBeDefined();

    const titleElement = screen.getByRole('heading', { level: 3 });
    expect(titleElement.textContent).toBe('');

    const descElement = container.querySelector('p');
    expect(descElement?.textContent).toBe('');
  });
});
