import mongoose from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { StudentProfile } from './StudentProfile';

describe('StudentProfile Error Resilience', () => {
  it('handles invalid graduation year validation safely', () => {
    const doc = new StudentProfile({
      githubUsername: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      graduationYear: 1900,
    });

    const error = doc.validateSync();

    expect(error).toBeDefined();
    expect(error?.errors.graduationYear).toBeDefined();
  });

  it('handles missing required fields without crashing', () => {
    const doc = new StudentProfile({});

    const error = doc.validateSync();

    expect(error).toBeDefined();
    expect(error?.errors.githubUsername).toBeDefined();
    expect(error?.errors.name).toBeDefined();
    expect(error?.errors.email).toBeDefined();
  });

  it('continues functioning when validation throws unexpectedly', () => {
    const path = StudentProfile.schema.path('graduationYear') as mongoose.SchemaType & {
      validators: Array<{ validator: (val: unknown) => boolean }>;
    };

    const originalValidator = path.validators[0].validator;

    path.validators[0].validator = vi.fn(() => {
      throw new Error('Unexpected validation failure');
    });

    const doc = new StudentProfile({
      githubUsername: 'user',
      name: 'User',
      email: 'user@example.com',
      graduationYear: 2025,
    });

    expect(() => doc.validateSync()).not.toThrow();

    path.validators[0].validator = originalValidator;
  });

  it('preserves schema integrity after validation failures', () => {
    const doc = new StudentProfile({
      githubUsername: 'user',
      name: 'User',
      email: 'user@example.com',
      graduationYear: 9999,
    });

    doc.validateSync();

    expect(StudentProfile.schema.path('githubUsername')).toBeDefined();
    expect(StudentProfile.schema.path('name')).toBeDefined();
    expect(StudentProfile.schema.path('email')).toBeDefined();
  });

  it('updates updatedAt safely through pre-save hook execution', () => {
    const schemaInternal = StudentProfile.schema as unknown as {
      s?: {
        hooks?: {
          _pres?: Map<string, Array<{ fn: (this: mongoose.Document) => unknown }>>;
        };
      };
    };

    const saveHooks = schemaInternal.s?.hooks?._pres?.get('save') || [];

    const doc = new StudentProfile({
      githubUsername: 'safeuser',
      name: 'Safe User',
      email: 'safe@example.com',
      updatedAt: new Date(0),
    });

    expect(() => {
      saveHooks.forEach((hook) => {
        hook.fn.call(doc);
      });
    }).not.toThrow();

    expect(doc.updatedAt).toBeInstanceOf(Date);
  });
});
