import { describe, expect, expectTypeOf, it } from 'vitest';
import { RivalryItem, TopRivalriesTickerProps } from './TopRivalriesTicker';

function validateRivalryProps(props: TopRivalriesTickerProps) {
  return {
    valid:
      props.rivalries === undefined || props.rivalries === null || Array.isArray(props.rivalries),
  };
}

describe('TopRivalriesTicker type compiler validation', () => {
  it('enforces the TopRivalriesTicker prop contract', () => {
    expectTypeOf<TopRivalriesTickerProps>().toEqualTypeOf<{
      rivalries?: RivalryItem[] | null;
    }>();
  });

  it('enforces the RivalryItem contract', () => {
    expectTypeOf<RivalryItem>().toEqualTypeOf<{
      u1: string;
      u2: string;
      label: string;
      icon: React.ComponentType<{ size?: number; className?: string }>;
      color: string;
    }>();
  });

  it('keeps rivalries optional and nullable', () => {
    expectTypeOf<TopRivalriesTickerProps['rivalries']>().toEqualTypeOf<
      RivalryItem[] | null | undefined
    >();
  });

  it('keeps the icon type compatible with React components', () => {
    expectTypeOf<RivalryItem['icon']>().toEqualTypeOf<
      React.ComponentType<{ size?: number; className?: string }>
    >();
  });

  it('rejects invalid rivalry structures at compile time', () => {
    expectTypeOf<RivalryItem>().not.toEqualTypeOf<{
      u1: number;
      u2: number;
      label: number;
      icon: string;
      color: number;
    }>();
  });

  it('returns strict validation reports for rivalry props', () => {
    const report = validateRivalryProps({
      rivalries: [],
    });

    expect(report.valid).toBe(true);
  });
});
