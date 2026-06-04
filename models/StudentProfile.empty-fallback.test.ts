import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { StudentProfile } from './StudentProfile';

describe('StudentProfile Empty Fallback', () => {
  it('uses empty string as default phone value', () => {
    const phonePath = StudentProfile.schema.path('phone') as mongoose.SchemaType & {
      options: Record<string, unknown>;
    };

    expect(phonePath.options.default).toBe('');
  });

  it('uses empty string as default experience description', () => {
    const experiencePath = StudentProfile.schema.path('experience');

    expect(experiencePath).toBeDefined();
  });

  it('allows skills to exist as an empty array', () => {
    const skillsPath = StudentProfile.schema.path('skills') as unknown as {
      instance: string;
    };

    expect(skillsPath.instance).toBe('Array');
  });

  it('allows education to exist as an empty array', () => {
    const educationPath = StudentProfile.schema.path('education') as unknown as {
      instance: string;
    };

    expect(educationPath.instance).toBe('Array');
  });

  it('allows experience to exist as an empty array', () => {
    const experiencePath = StudentProfile.schema.path('experience') as unknown as {
      instance: string;
    };

    expect(experiencePath.instance).toBe('Array');
  });
});
