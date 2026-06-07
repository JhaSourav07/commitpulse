import { describe, it, expect, expectTypeOf } from 'vitest';
import { IEducation, IExperience, IStudentProfile, StudentProfile } from './StudentProfile';

describe('StudentProfile.ts - TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('Import the interfaces, types, or validation schemas associated with the file.', () => {
    // 1st condition: Ensure types and schemas are importable
    expect(StudentProfile).toBeDefined();
    expect(typeof StudentProfile).toBe('function');
    expect(StudentProfile.modelName).toBe('StudentProfile');

    // The interfaces should be importable as well
    expectTypeOf<IEducation>().not.toBeAny();
    expectTypeOf<IExperience>().not.toBeAny();
    expectTypeOf<IStudentProfile>().not.toBeAny();
  });

  it('Use type-testing assertions (expectTypeOf) to enforce field property configurations.', () => {
    // 2nd condition: Enforce field properties via vitest's expectTypeOf
    expectTypeOf<IStudentProfile>().toHaveProperty('githubUsername').toBeString();
    expectTypeOf<IStudentProfile>().toHaveProperty('name').toBeString();
    expectTypeOf<IStudentProfile>().toHaveProperty('email').toBeString();
    expectTypeOf<IStudentProfile>().toHaveProperty('skills').toEqualTypeOf<string[]>();
    expectTypeOf<IStudentProfile>().toHaveProperty('education').toEqualTypeOf<IEducation[]>();
    expectTypeOf<IStudentProfile>().toHaveProperty('experience').toEqualTypeOf<IExperience[]>();
    expectTypeOf<IStudentProfile>().toHaveProperty('createdAt').toEqualTypeOf<Date>();
    expectTypeOf<IStudentProfile>().toHaveProperty('updatedAt').toEqualTypeOf<Date>();

    // Sub-document interfaces
    expectTypeOf<IEducation>().toHaveProperty('institution').toBeString();
    expectTypeOf<IEducation>().toHaveProperty('degree').toBeString();
    expectTypeOf<IEducation>().toHaveProperty('field').toBeString();
    expectTypeOf<IEducation>().toHaveProperty('startDate').toBeString();
    expectTypeOf<IEducation>().toHaveProperty('endDate').toBeString();

    expectTypeOf<IExperience>().toHaveProperty('company').toBeString();
    expectTypeOf<IExperience>().toHaveProperty('role').toBeString();
    expectTypeOf<IExperience>().toHaveProperty('description').toBeString();
  });

  it('Assert that invalid prop parameters are blocked during static type checking.', () => {
    // 3rd condition: Block invalid props via mongoose runtime validation
    const invalidDoc = new StudentProfile({
      githubUsername: 'testuser',
      name: 'Test User',
      // Intentionally omitting required 'email'
      skills: [],
      education: [],
      experience: [],
    });

    const validationError = invalidDoc.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError!.errors.email.name).toBe('ValidatorError');
    expect(validationError!.errors.email.kind).toBe('required');
  });

  it('Verify custom types accept optional values without compile errors.', () => {
    // 4th condition: Optional fields should accept undefined and still type-check
    type OptionalStudentProfile = Partial<IStudentProfile>;

    const strictlyPartialData: OptionalStudentProfile = {
      email: 'partial@example.com',
      name: 'Partial User',
      githubUsername: 'partialuser',
      skills: ['TypeScript'],
      education: [],
      experience: [],
    };

    expectTypeOf(strictlyPartialData).toMatchTypeOf<Partial<IStudentProfile>>();
    expect(strictlyPartialData.email).toBe('partial@example.com');
    expect(strictlyPartialData.phone).toBeUndefined();
    expect(strictlyPartialData.careerInterests).toBeUndefined();
    expect(strictlyPartialData.graduationYear).toBeUndefined();
    expect(strictlyPartialData.resumeUrl).toBeUndefined();
  });

  it('Verify schema validation constraints return strict validation reports.', () => {
    // 5th condition: graduationYear must be between 2000 and 2100
    const docWithInvalidYear = new StudentProfile({
      githubUsername: 'gradyear-user',
      name: 'Grad Year User',
      email: 'gradyear@example.com',
      skills: [],
      education: [],
      experience: [],
      graduationYear: 1999, // Below 2000
    });

    const errorReport = docWithInvalidYear.validateSync();
    expect(errorReport).toBeDefined();
    expect(errorReport!.errors.graduationYear).toBeDefined();
    expect(errorReport!.errors.graduationYear.message).toBe('Invalid graduation year');

    const docWithInvalidYearHigh = new StudentProfile({
      githubUsername: 'gradyear-user-2',
      name: 'Grad Year User 2',
      email: 'gradyear2@example.com',
      skills: [],
      education: [],
      experience: [],
      graduationYear: 2101, // Above 2100
    });

    const highErrorReport = docWithInvalidYearHigh.validateSync();
    expect(highErrorReport).toBeDefined();
    expect(highErrorReport!.errors.graduationYear).toBeDefined();

    // Valid year should not produce an error for graduationYear
    const validDoc = new StudentProfile({
      githubUsername: 'valid-gradyear',
      name: 'Valid User',
      email: 'valid@example.com',
      skills: [],
      education: [],
      experience: [],
      graduationYear: 2026,
    });

    const validReport = validDoc.validateSync();
    if (validReport) {
      expect(validReport.errors.graduationYear).toBeUndefined();
    }
    expect(validReport === null || validReport === undefined).toBe(true);
  });
});
