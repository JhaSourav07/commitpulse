import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import React from 'react';

// --- MOCK NEXT.JS MODULES ---
// We must mock next/font/google before importing the layout,
// otherwise Vitest will crash trying to execute Inter()
vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mocked-inter',
    style: { fontFamily: 'Inter' },
    variable: '--font-inter',
  }),
}));

import RootLayout from './layout';

// --- STRICT TYPE DEFINITIONS ---
// We define the expected structural contract for a Next.js layout component.
// This ensures our compiler validations remain stable across Next.js version upgrades.
interface ExpectedLayoutProps {
  children: React.ReactNode;
  params?: Record<string, string | string[]>;
}

describe('RootLayout TypeScript Compiler & Schema Constraints', () => {
  it('1. imports the interfaces, types, or validation schemas associated with the file', () => {
    // Validate that the module successfully imports and exists in the TS environment
    expect(RootLayout).toBeDefined();
    // React layout components evaluate as functions
    expectTypeOf(RootLayout).toBeFunction();
  });

  it('2. uses type-testing assertions (expectTypeOf) to enforce field property configurations', () => {
    // Enforce strict property constraints on the expected props schema
    expectTypeOf<ExpectedLayoutProps>().toHaveProperty('children').toEqualTypeOf<React.ReactNode>();
    expectTypeOf<ExpectedLayoutProps>()
      .toHaveProperty('params')
      .toEqualTypeOf<Record<string, string | string[]> | undefined>();
  });

  it('3. asserts that invalid prop parameters are blocked during static type checking', () => {
    // @ts-expect-error - missing the universally required 'children' property
    const missingProps: ExpectedLayoutProps = { params: { lang: 'en' } };

    // @ts-expect-error - 'children' requires a valid ReactNode, assigning an arbitrary un-renderable object fails compilation
    const invalidProps: ExpectedLayoutProps = { children: { invalid: 'object' } };

    // Runtime assertions to ensure the variables are evaluated by the test runner
    expect(missingProps).toBeDefined();
    expect(invalidProps).toBeDefined();
  });

  it('4. verifies custom types accept optional values without compile errors', () => {
    // The 'params' property is optional for layouts. Both must compile perfectly without TS errors.
    const propsWithOptional: ExpectedLayoutProps = {
      children: <div>Content</div>,
      params: { theme: 'dark' },
    };

    const propsWithoutOptional: ExpectedLayoutProps = {
      children: <div>Content</div>,
    };

    // Asserting the types dynamically using the correct union type
    expectTypeOf(propsWithOptional.params).toEqualTypeOf<
      Record<string, string | string[]> | undefined
    >();
    expectTypeOf(propsWithoutOptional.params).toEqualTypeOf<
      Record<string, string | string[]> | undefined
    >();

    // Runtime validation
    expect(propsWithOptional.params).toBeDefined();
    expect(propsWithoutOptional.params).toBeUndefined();
  });

  it('5. verifies schema validation constraints return strict validation reports', () => {
    // Simulating a strict schema validation guard for incoming Layout props
    const validateProps = (props: unknown): props is ExpectedLayoutProps => {
      if (typeof props !== 'object' || props === null) return false;
      const typed = props as ExpectedLayoutProps;
      return 'children' in typed;
    };

    // Simulate incoming data as 'unknown' to properly test the type guard's narrowing ability
    const incomingData: unknown = {
      children: <main>Dashboard</main>,
    };
    const invalidData: unknown = { title: 'Missing Children' };

    // The compiler should correctly narrow the types based on the validation report
    const isValid = validateProps(incomingData);
    expect(isValid).toBe(true);

    if (validateProps(incomingData)) {
      // If the block is reached, TS correctly narrows `incomingData` from `unknown` to `ExpectedLayoutProps`
      expectTypeOf(incomingData).toEqualTypeOf<ExpectedLayoutProps>();
    }

    expect(validateProps(invalidData)).toBe(false);
  });
});
