import { describe, expectTypeOf, it } from 'vitest';
import Highlights from './Highlights';
import type { PRInsightData } from '@/services/github/pr-insights';

type HighlightsProps = React.ComponentProps<typeof Highlights>;
type HighlightsData = PRInsightData['highlights'];

describe('Highlights Type Compiler Validation', () => {
  it('accepts valid highlights prop type', () => {
    expectTypeOf<HighlightsProps['highlights']>().toEqualTypeOf<HighlightsData>();
  });

  it('exports Highlights as a callable React component', () => {
    expectTypeOf(Highlights).toBeFunction();
  });

  it('accepts valid component props', () => {
    const props: HighlightsProps = {
      highlights: {} as HighlightsData,
    };

    expectTypeOf(props).toMatchTypeOf<HighlightsProps>();
  });

  it('preserves schema type for highlights', () => {
    expectTypeOf<HighlightsData>().toMatchTypeOf<PRInsightData['highlights']>();
  });

  it('supports compile-time validation for component props', () => {
    expectTypeOf<HighlightsProps>().toHaveProperty('highlights');
  });
});

// Compile-time validation

void ({
  // @ts-expect-error highlights must follow PRInsightData['highlights']
  highlights: 'invalid',
} satisfies HighlightsProps);

void ({
  // @ts-expect-error highlights cannot be a number
  highlights: 123,
} satisfies HighlightsProps);
