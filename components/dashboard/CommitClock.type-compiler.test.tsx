// components/dashboard/CommitClock.type-compiler.test.tsx
//
// TypeScript Compiler Validation & Schema Constraint Stability Tests
// for CommitClock and its supporting types from types/dashboard.ts
//
// NOTE: CommitClock has no Zod/Yup/Valibot schemas. Structural contract
// validation is therefore performed via `satisfies`, compile-time type
// assignments, and `// @ts-expect-error` directives instead of schema
// parse/safeParse calls.

import { describe, expect, expectTypeOf, it } from 'vitest';
import type { CommitClockData } from '../../types/dashboard';

// ---------------------------------------------------------------------------
// Minimal stand-in for the CommitClock component props.
// In the real project this would be imported from the component file:
//   import type { CommitClockProps } from './CommitClock';
// We reconstruct it from the component's actual public API so that the tests
// remain valid even when the component implementation details change.
// ---------------------------------------------------------------------------
interface CommitClockProps {
  /** The array of per-day commit totals rendered by the clock face. Required. */
  data: CommitClockData[];
  /** Optional CSS class forwarded to the outermost wrapper element. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Test 1 – Type Shape Validation
// Verifies that CommitClockData exposes exactly the fields & primitive types
// the component contract promises, so renames or type widening are caught at
// compile time before they reach the component's rendering logic.
// ---------------------------------------------------------------------------
describe('Test 1: CommitClockData type shape', () => {
  it('day field is a string and commits field is a number', () => {
    // `day` stores a weekday abbreviation string ('Sun' … 'Sat'); commits is
    // a non-negative integer. Both must remain primitive, non-optional values.
    expectTypeOf<CommitClockData>().toHaveProperty('day').toBeString();
    expectTypeOf<CommitClockData>().toHaveProperty('commits').toBeNumber();
  });

  it('CommitClockData has no extra undeclared properties at the type level', () => {
    // Guard against accidental property additions silently changing the
    // public interface without a corresponding consumer update.
    type Keys = keyof CommitClockData;
    expectTypeOf<Keys>().toEqualTypeOf<'day' | 'commits'>();
  });

  it('CommitClockProps requires data array and permits optional className', () => {
    expectTypeOf<CommitClockProps>().toHaveProperty('data').toEqualTypeOf<CommitClockData[]>();

    expectTypeOf<CommitClockProps>()
      .toHaveProperty('className')
      .toEqualTypeOf<string | undefined>();
  });
});

// ---------------------------------------------------------------------------
// Test 2 – Invalid Prop Rejection
// Uses `// @ts-expect-error` to assert that structurally invalid assignments
// are rejected by the TypeScript compiler.  If the type guard ever widens to
// accept these values, the directive itself becomes a compile error, surfacing
// the regression immediately.
// ---------------------------------------------------------------------------
describe('Test 2: CommitClockData rejects invalid shapes', () => {
  it('rejects a numeric day value', () => {
    // @ts-expect-error — `day` must be string, not number
    const bad1: CommitClockData = { day: 0, commits: 5 };
    // The variable is referenced to prevent "unused variable" lint errors;
    // the real assertion is the compiler error above.
    expect(bad1).toBeDefined();
  });

  it('rejects a string commits value', () => {
    // @ts-expect-error — `commits` must be number, not string
    const bad2: CommitClockData = { day: 'Mon', commits: '12' };
    expect(bad2).toBeDefined();
  });

  it('rejects an object missing the required commits field', () => {
    // @ts-expect-error — `commits` is required and must not be omitted
    const bad3: CommitClockData = { day: 'Wed' };
    expect(bad3).toBeDefined();
  });

  it('rejects an object missing the required day field', () => {
    // @ts-expect-error — `day` is required and must not be omitted
    const bad4: CommitClockData = { commits: 3 };
    expect(bad4).toBeDefined();
  });

  it('rejects CommitClockProps when data prop is omitted', () => {
    // @ts-expect-error — `data` is required on CommitClockProps
    const badProps: CommitClockProps = { className: 'chart' };
    expect(badProps).toBeDefined();
  });

  it('rejects CommitClockProps when data contains an invalid element shape', () => {
    // @ts-expect-error — array elements must satisfy CommitClockData
    const badProps2: CommitClockProps = { data: [{ day: 'Fri', commits: 'five' }] };
    expect(badProps2).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 3 – Optional Value Acceptance
// Confirms that CommitClockProps.className correctly accepts `undefined` and
// that an array of zero elements is a structurally valid `data` value, since
// the component must handle an empty dataset gracefully.
// ---------------------------------------------------------------------------
describe('Test 3: CommitClockProps accepts valid optional configurations', () => {
  it('compiles when className is omitted', () => {
    // No className key present — must compile without errors.
    const props: CommitClockProps = {
      data: [{ day: 'Mon', commits: 4 }],
    };
    expect(props.className).toBeUndefined();
  });

  it('compiles when className is explicitly undefined', () => {
    const props: CommitClockProps = {
      data: [],
      className: undefined,
    };
    expect(props.className).toBeUndefined();
  });

  it('compiles when className is a non-empty string', () => {
    const props: CommitClockProps = {
      data: [{ day: 'Sat', commits: 0 }],
      className: 'commit-clock--compact',
    };
    expect(props.className).toBe('commit-clock--compact');
  });

  it('accepts an empty data array (no-data / loading state)', () => {
    // The component should not crash when passed an empty dataset.
    // An empty array must satisfy CommitClockData[] without type errors.
    const emptyProps: CommitClockProps = { data: [] };
    expectTypeOf(emptyProps.data).toEqualTypeOf<CommitClockData[]>();
    expect(emptyProps.data).toHaveLength(0);
  });

  it('accepts a full seven-day dataset', () => {
    const fullWeek: CommitClockData[] = [
      { day: 'Sun', commits: 0 },
      { day: 'Mon', commits: 8 },
      { day: 'Tue', commits: 3 },
      { day: 'Wed', commits: 12 },
      { day: 'Thu', commits: 5 },
      { day: 'Fri', commits: 9 },
      { day: 'Sat', commits: 1 },
    ];

    const props: CommitClockProps = { data: fullWeek };
    expect(props.data).toHaveLength(7);
    expectTypeOf(props.data).toEqualTypeOf<CommitClockData[]>();
  });
});

// ---------------------------------------------------------------------------
// Test 4 – Schema Constraint Stability
// There is no Zod/Yup/Valibot schema in this module.  We therefore validate
// structural constraints using the TypeScript `satisfies` operator, which
// acts as a compile-time schema check: if a value does not conform to the
// declared type, TypeScript raises an error on the `satisfies` expression
// rather than silently widening.  This pinpoints constraint violations to the
// value site, mirroring the behaviour of schema.parse() for type-only
// projects.
// ---------------------------------------------------------------------------
describe('Test 4: Structural constraint stability via satisfies', () => {
  it('a well-formed single entry satisfies CommitClockData', () => {
    // `satisfies` asserts the literal conforms to the interface at the
    // definition site.  If CommitClockData gains a required field later,
    // this line becomes a compile error immediately.
    const entry = { day: 'Thu', commits: 7 } satisfies CommitClockData;
    expect(entry.commits).toBe(7);
  });

  it('a full seven-entry array satisfies CommitClockData[]', () => {
    const dataset = [
      { day: 'Sun', commits: 2 },
      { day: 'Mon', commits: 6 },
      { day: 'Tue', commits: 4 },
      { day: 'Wed', commits: 9 },
      { day: 'Thu', commits: 1 },
      { day: 'Fri', commits: 7 },
      { day: 'Sat', commits: 3 },
    ] satisfies CommitClockData[];

    expect(dataset).toHaveLength(7);
    // Verify each element's numeric constraint has not been widened
    dataset.forEach((entry) => {
      expectTypeOf(entry.commits).toBeNumber();
      expectTypeOf(entry.day).toBeString();
    });
  });

  it('CommitClockProps satisfies its own interface when fully populated', () => {
    const props = {
      data: [{ day: 'Fri', commits: 11 }],
      className: 'widget',
    } satisfies CommitClockProps;

    expect(props.data[0].commits).toBe(11);
  });

  it('zero commits is a valid constraint value (boundary)', () => {
    // commits represents a count; 0 is a legitimate boundary value that
    // must not be filtered by the type.
    const zeroBoundary = { day: 'Sun', commits: 0 } satisfies CommitClockData;
    expect(zeroBoundary.commits).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Test 5 – Type ↔ Schema Consistency
// Without a schema, this test validates that the inferred type of a runtime
// value constructed from real data is structurally assignable to (and from)
// the exported CommitClockData interface — ensuring no silent drift between
// what the component receives at runtime and what the type system describes.
// It also checks that CommitClockData is not accidentally widened or narrowed
// relative to CommitClockProps['data'][number], which is the type the
// component actually consumes after destructuring its prop.
// ---------------------------------------------------------------------------
describe('Test 5: Type consistency between CommitClockData and CommitClockProps usage', () => {
  it('CommitClockData is assignable to the element type of CommitClockProps.data', () => {
    // Props.data is CommitClockData[]; its element type must equal CommitClockData.
    type PropsDataElement = CommitClockProps['data'][number];
    expectTypeOf<PropsDataElement>().toEqualTypeOf<CommitClockData>();
  });

  it('CommitClockData element type is bidirectionally assignable (no accidental narrowing)', () => {
    type PropsDataElement = CommitClockProps['data'][number];
    // Forward: CommitClockData → element type
    expectTypeOf<CommitClockData>().toMatchTypeOf<PropsDataElement>();
    // Reverse: element type → CommitClockData
    expectTypeOf<PropsDataElement>().toMatchTypeOf<CommitClockData>();
  });

  it('a runtime-constructed value round-trips through CommitClockData without type loss', () => {
    // Simulate the kind of value that arrives from an API transformer before
    // being passed to CommitClock.  We verify type inference has not widened
    // `day` to `string` in a way that loses the CommitClockData contract.
    function buildEntry(day: string, commits: number): CommitClockData {
      return { day, commits };
    }

    const entry = buildEntry('Tue', 6);
    expectTypeOf(entry).toEqualTypeOf<CommitClockData>();
    expect(entry).toStrictEqual({ day: 'Tue', commits: 6 });
  });

  it('an array produced by map() over raw data satisfies CommitClockData[]', () => {
    // Mirrors a real consumer: mapping API payload rows into CommitClockData
    // objects.  If a future refactor changes CommitClockData, the `satisfies`
    // here catches the mismatch at the mapping site.
    const raw = [
      { label: 'Mon', count: 3 },
      { label: 'Tue', count: 8 },
    ];

    const mapped = raw.map(
      (r): CommitClockData => ({ day: r.label, commits: r.count })
    ) satisfies CommitClockData[];

    expect(mapped).toHaveLength(2);
    expectTypeOf(mapped).toEqualTypeOf<CommitClockData[]>();
  });
});
