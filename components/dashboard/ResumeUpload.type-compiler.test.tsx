import { describe, expectTypeOf, it } from 'vitest';
import ResumeUpload, { type ResumeUploadProps } from './ResumeUpload';
import type { ParsedResume } from '@/types/student';

describe('ResumeUpload Type Compiler Validation', () => {
  it('exports component as a callable React component', () => {
    expectTypeOf(ResumeUpload).toBeFunction();
  });

  it('requires onParsed callback with correct signature', () => {
    expectTypeOf<ResumeUploadProps['onParsed']>().toEqualTypeOf<
      (data: ParsedResume, fileName: string) => void
    >();
  });

  it('requires onError callback with correct signature', () => {
    expectTypeOf<ResumeUploadProps['onError']>().toEqualTypeOf<(error: string) => void>();
  });

  it('maintains valid props structure', () => {
    expectTypeOf<ResumeUploadProps>().toMatchTypeOf<{
      onParsed: (data: ParsedResume, fileName: string) => void;
      onError: (error: string) => void;
    }>();
  });

  it('accepts ParsedResume as callback input type', () => {
    expectTypeOf<Parameters<ResumeUploadProps['onParsed']>[0]>().toEqualTypeOf<ParsedResume>();

    expectTypeOf<Parameters<ResumeUploadProps['onParsed']>[1]>().toEqualTypeOf<string>();
  });
});
