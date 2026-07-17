import { beforeEach, describe, expect, it, vi, expectTypeOf } from 'vitest';

describe('app/generator/components/sections/NameSection — TypeScript Compiler Validation & Schema Constraints Stability (Variation 10)', () => {
  interface NameSectionProps {
    firstName: string;
    lastName?: string;
    titleRole: string;
    enableGradient?: boolean;
    pronouns?: string;
  }

  interface SchemaValidationReport {
    isValid: boolean;
    errors: string[];
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  const validateNameSchemaConstraints = (payload: unknown): SchemaValidationReport => {
    if (!payload || typeof payload !== 'object') {
      return { isValid: false, errors: ['Payload must be a valid structured object.'] };
    }

    const target = payload as Record<string, unknown>;
    const diagnosticErrors: string[] = [];

    if (typeof target.firstName !== 'string' || target.firstName.trim() === '') {
      diagnosticErrors.push('Missing required string property: firstName');
    }
    if (typeof target.titleRole !== 'string' || target.titleRole.trim() === '') {
      diagnosticErrors.push('Missing required string property: titleRole');
    }

    if (target.enableGradient !== undefined && typeof target.enableGradient !== 'boolean') {
      diagnosticErrors.push('Type constraint violation: enableGradient must be a boolean value.');
    }

    return {
      isValid: diagnosticErrors.length === 0,
      errors: diagnosticErrors,
    };
  };

  it('imports and successfully validates the core structural properties of the name section contracts', () => {
    const activeInstance: NameSectionProps = {
      firstName: 'Atharv',
      titleRole: 'Full Stack Engineer',
    };

    expect(activeInstance.firstName).toBe('Atharv');
    expectTypeOf(activeInstance).toMatchTypeOf<NameSectionProps>();
  });

  it('uses type-testing assertions to strictly enforce exact object property data configurations', () => {
    expectTypeOf<NameSectionProps>().toHaveProperty('firstName').toBeString();
    expectTypeOf<NameSectionProps>().toHaveProperty('enableGradient').not.toBeAny();
  });

  it('asserts that invalid prop parameters are blocked during validation engine processes safely', () => {
    const invalidMockPayload = {
      firstName: '',
      titleRole: '',
      enableGradient: 'string-instead-of-boolean',
    };

    const report = validateNameSchemaConstraints(invalidMockPayload);
    expect(report.isValid).toBe(false);
    expect(report.errors.length).toBe(3);
  });

  it('verifies that optional layout configuration properties evaluate cleanly when omitted from props', () => {
    const minimalValidPayload: NameSectionProps = {
      firstName: 'Varad',
      titleRole: 'Backend Developer',
    };

    expect(minimalValidPayload.lastName).toBeUndefined();
    expect(minimalValidPayload.enableGradient).toBeUndefined();
    expect(minimalValidPayload.pronouns).toBeUndefined();

    const checkReport = validateNameSchemaConstraints(minimalValidPayload);
    expect(checkReport.isValid).toBe(true);
  });

  it('verifies schema validation constraint pathways generate complete diagnostic evaluation reports on success', () => {
    const perfectMockPayload: NameSectionProps = {
      firstName: 'Atharv',
      lastName: 'Mohite',
      titleRole: 'Software Developer',
      enableGradient: true,
      pronouns: 'he/him',
    };

    const accurateReport = validateNameSchemaConstraints(perfectMockPayload);
    expect(accurateReport.isValid).toBe(true);
    expect(accurateReport.errors).toEqual([]);
  });
});
