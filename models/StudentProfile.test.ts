import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import { StudentProfile } from './StudentProfile';

describe('StudentProfile Model', () => {
  // Test Case 1: Model compilation and exposure
  it('is compiled properly and exposed', () => {
    expect(StudentProfile).toBeDefined();
    expect(StudentProfile.modelName).toBe('StudentProfile');
  });

  // Test Case 2: Required name and email fields
  it('enforces student name and email as required fields', () => {
    const namePath = StudentProfile.schema.path('name') as mongoose.SchemaType & {
      options: Record<string, unknown>;
    };
    const emailPath = StudentProfile.schema.path('email') as mongoose.SchemaType & {
      options: Record<string, unknown>;
    };

    expect(namePath.options.required).toBe(true);
    expect(emailPath.options.required).toBe(true);
  });

  // Test Case 3: githubUsername formats and constraints
  it('enforces githubUsername formats and constraints', () => {
    const githubUsernamePath = StudentProfile.schema.path(
      'githubUsername'
    ) as mongoose.SchemaType & {
      options: Record<string, unknown>;
    };

    expect(githubUsernamePath.options.required).toBe(true);
    expect(githubUsernamePath.options.unique).toBe(true);
    expect(githubUsernamePath.options.lowercase).toBe(true);
    expect(githubUsernamePath.options.trim).toBe(true);
  });

  // Test Case 4: careerInterests as string array
  it('enforces careerInterests to parse as a string array', () => {
    const careerInterestsPath = StudentProfile.schema.path('careerInterests') as unknown as {
      instance: string;
      embeddedSchemaType?: { instance: string };
    };

    expect(careerInterestsPath).toBeDefined();
    expect(careerInterestsPath.instance).toBe('Array');
    expect(careerInterestsPath.embeddedSchemaType?.instance).toBe('String');
  });

  // Test Case 5: Custom validator on graduation years
  it('enforces graduationYear validation constraints', () => {
    const graduationYearPath = StudentProfile.schema.path(
      'graduationYear'
    ) as mongoose.SchemaType & {
      validators: Array<{ validator: (val: unknown) => boolean }>;
    };

    expect(graduationYearPath).toBeDefined();
    expect(graduationYearPath.validators).toBeDefined();
    expect(graduationYearPath.validators.length).toBeGreaterThan(0);

    const validatorFn = graduationYearPath.validators[0].validator;
    expect(validatorFn(2000)).toBe(true);
    expect(validatorFn(2026)).toBe(true);
    expect(validatorFn(2100)).toBe(true);
    expect(validatorFn(1999)).toBe(false);
    expect(validatorFn(2101)).toBe(false);
  });

  // Test Case 6: pre-save hook updates updatedAt
  describe('pre-save hook', () => {
    it('updates the updatedAt field to the current date/time on save', () => {
      const schemaInternal = StudentProfile.schema as unknown as {
        s?: {
          hooks?: {
            _pres?: Map<
              string,
              Array<{ fn: (this: mongoose.Document, ...args: unknown[]) => unknown }>
            >;
          };
        };
      };
      const pres = schemaInternal.s?.hooks?._pres;
      const saveHooks = pres?.get('save') || [];

      const doc = new StudentProfile({
        githubUsername: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        updatedAt: new Date(Date.now() - 100000),
      });

      for (const hook of saveHooks) {
        if (typeof hook.fn === 'function') {
          const fnWithMetadata = hook.fn as unknown as Record<string | symbol, unknown>;
          const isBuiltIn = fnWithMetadata[Symbol.for('mongoose:built-in-middleware')];
          if (!isBuiltIn) {
            hook.fn.call(doc);
          }
        }
      }

      expect(doc.updatedAt.getTime()).toBeGreaterThan(Date.now() - 5000);
    });
  });
});
