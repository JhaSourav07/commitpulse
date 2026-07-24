// app/api/student/resume/upload/route.type-compiler.test.ts

import { describe, it, expectTypeOf } from 'vitest';

import type {
  ParsedResume,
  Education,
  Experience,
  ResumeUploadResponse,
  ResumeConfirmResponse,
} from '@/types/student';

describe('Resume Upload Type Compiler Validation', () => {
  it('validates ParsedResume structure', () => {
    expectTypeOf<ParsedResume>().toEqualTypeOf<{
      name: string;
      email: string;
      phone: string;
      skills: string[];
      education: Education[];
      experience: Experience[];
    }>();
  });

  it('validates Education structure', () => {
    expectTypeOf<Education>().toEqualTypeOf<{
      institution: string;
      degree: string;
      field: string;
      startDate: string;
      endDate: string;
    }>();
  });

  it('validates Experience structure', () => {
    expectTypeOf<Experience>().toEqualTypeOf<{
      company: string;
      role: string;
      startDate: string;
      endDate: string;
      description: string;
    }>();
  });

  it('accepts optional fields in ResumeUploadResponse', () => {
    expectTypeOf<ResumeUploadResponse>().toEqualTypeOf<{
      success: boolean;
      data?: ParsedResume;
      fileName?: string;
      error?: string;
    }>();
  });

  it('accepts optional error field in ResumeConfirmResponse', () => {
    expectTypeOf<ResumeConfirmResponse>().toEqualTypeOf<{
      success: boolean;
      error?: string;
    }>();
  });
});
