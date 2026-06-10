// lib/resume-parser.type-compiler.test.ts

import { describe, expectTypeOf, it } from 'vitest';
import { parseResume, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from './resume-parser';

import type { ParsedResume, Education, Experience } from '@/types/student';

describe('Resume Parser Type Compiler Validation', () => {
  it('returns a Promise of ParsedResume', () => {
    expectTypeOf(parseResume).returns.toEqualTypeOf<Promise<ParsedResume>>();
  });

  it('accepts expected parseResume parameter types', () => {
    expectTypeOf(parseResume).parameters.toEqualTypeOf<[Buffer, string]>();
  });

  it('validates ParsedResume structure', () => {
    expectTypeOf<ParsedResume>().toMatchTypeOf({
      name: '',
      email: '',
      phone: '',
      skills: [] as string[],
      education: [] as Education[],
      experience: [] as Experience[],
    });
  });

  it('enforces allowed mime types array typing', () => {
    expectTypeOf(ALLOWED_MIME_TYPES).toEqualTypeOf<string[]>();
  });

  it('enforces MAX_FILE_SIZE numeric typing', () => {
    expectTypeOf(MAX_FILE_SIZE).toEqualTypeOf<number>();
  });
});
