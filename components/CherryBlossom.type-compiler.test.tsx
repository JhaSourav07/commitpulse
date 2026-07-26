import { describe, expect, expectTypeOf, it } from 'vitest';
import CherryBlossom, { type Petal } from './CherryBlossom';

// CherryBlossom takes no props

const requiredPetalKeys = [
  'id',
  'x',
  'y',
  'scale',
  'duration',
  'delay',
  'rotation',
  'rotationSpeed',
  'sway',
] as const;

function validatePetal(value: Petal) {
  return {
    valid:
      typeof value.id === 'number' &&
      typeof value.x === 'number' &&
      typeof value.y === 'number' &&
      typeof value.scale === 'number' &&
      typeof value.duration === 'number' &&
      typeof value.delay === 'number' &&
      typeof value.rotation === 'number' &&
      typeof value.rotationSpeed === 'number' &&
      typeof value.sway === 'number',
    keys: Object.keys(value),
  };
}

describe('CherryBlossom type compiler validation', () => {
  it('exports a component that does not require props', () => {
    expectTypeOf<Parameters<typeof CherryBlossom>>().toEqualTypeOf<[]>();
  });

  it('enforces the Petal field contract', () => {
    expectTypeOf<Petal>().toEqualTypeOf<{
      id: number;
      x: number;
      y: number;
      scale: number;
      duration: number;
      delay: number;
      rotation: number;
      rotationSpeed: number;
      sway: number;
    }>();
  });

  it('blocks invalid petal field types at compile time', () => {
    expectTypeOf<Petal>().not.toEqualTypeOf<{
      id: string; // invalid
      x: number;
      y: number;
      scale: number;
      duration: number;
      delay: number;
      rotation: number;
      rotationSpeed: number;
      sway: number;
    }>();
  });

  it('accepts optional petal-like values before validation', () => {
    type OptionalPetal = Partial<Petal>;

    const draftPetal: OptionalPetal = {
      id: 1,
      x: 50,
    };

    expectTypeOf<OptionalPetal>().toEqualTypeOf<Partial<Petal>>();
    expect(draftPetal.x).toBe(50);
  });

  it('returns strict validation reports for petal schema constraints', () => {
    const petal: Petal = {
      id: 1,
      x: 10,
      y: 20,
      scale: 1.5,
      duration: 5,
      delay: 2,
      rotation: 90,
      rotationSpeed: 10,
      sway: 5,
    };

    const report = validatePetal(petal);

    expect(report.valid).toBe(true);

    for (const key of requiredPetalKeys) {
      expect(report.keys).toContain(key);
    }
  });
});
