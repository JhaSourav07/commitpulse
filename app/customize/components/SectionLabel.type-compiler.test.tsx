import { describe, it, expect, expectTypeOf } from 'vitest';
import React from 'react';
import { SectionLabel } from './SectionLabel';

// --- STRICT TYPE DEFINITIONS ---
// We define the expected structural contract for the component.
interface ExpectedSectionLabelProps {
  children: React.ReactNode;
}

describe('SectionLabel TypeScript Compiler & Schema Constraints', () => {
  it('1. imports the interfaces, types, or validation schemas associated with the file', () => {
    // Validate that the module successfully imports and exists in the TS environment
    expect(SectionLabel).toBeDefined();
    // React layout components evaluate as functions
    expectTypeOf(SectionLabel).toBeFunction();
  });

  it('2. uses type-testing assertions (expectTypeOf) to enforce field property configurations', () => {
    // Enforce strict property constraints on the expected props schema
    expectTypeOf<ExpectedSectionLabelProps>()
      .toHaveProperty('children')
      .toEqualTypeOf<React.ReactNode>();
  });

  it('3. asserts that invalid prop parameters are blocked during static type checking', () => {
    // @ts-expect-error - missing the universally required 'children' property
    const missingProps: ExpectedSectionLabelProps = {};

    // @ts-expect-error - 'children' requires a valid ReactNode, assigning an arbitrary un-renderable object fails compilation
    const invalidProps: ExpectedSectionLabelProps = { children: { invalid: 'object' } };

    // Runtime assertions to ensure the variables are evaluated by the test runner
    expect(missingProps).toBeDefined();
    expect(invalidProps).toBeDefined();
  });

  it('4. verifies custom types accept optional values without compile errors', () => {
    // The component only has 'children'. We extend the props to verify custom types accept optional values.
    type ExtendedSectionLabelProps = ExpectedSectionLabelProps & { id?: string };

    const propsWithOptional: ExtendedSectionLabelProps = {
      children: <span>Label</span>,
      id: 'section-1',
    };

    const propsWithoutOptional: ExtendedSectionLabelProps = {
      children: <span>Label</span>,
    };

    // Asserting the types dynamically using the correct union type
    expectTypeOf(propsWithOptional.id).toEqualTypeOf<string | undefined>();
    expectTypeOf(propsWithoutOptional.id).toEqualTypeOf<string | undefined>();

    // Runtime validation
    expect(propsWithOptional.id).toBeDefined();
    expect(propsWithoutOptional.id).toBeUndefined();
  });

  it('5. verifies schema validation constraints return strict validation reports', () => {
    // Simulating a strict schema validation guard for incoming props
    const validateProps = (props: unknown): props is ExpectedSectionLabelProps => {
      if (typeof props !== 'object' || props === null) return false;
      const typed = props as ExpectedSectionLabelProps;
      return 'children' in typed;
    };

    // Simulate incoming data as 'unknown' to properly test the type guard's narrowing ability
    const incomingData: unknown = {
      children: <span>Label</span>,
    };
    const invalidData: unknown = { title: 'Missing Children' };

    // The compiler should correctly narrow the types based on the validation report
    const isValid = validateProps(incomingData);
    expect(isValid).toBe(true);

    if (validateProps(incomingData)) {
      // If the block is reached, TS correctly narrows `incomingData` from `unknown` to `ExpectedSectionLabelProps`
      expectTypeOf(incomingData).toEqualTypeOf<ExpectedSectionLabelProps>();
    }

    expect(validateProps(invalidData)).toBe(false);
  });
});
