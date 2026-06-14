// lib/resume-parser.timezone-boundaries.test.ts

import { describe, expect, it } from 'vitest';
import { parseResume } from './resume-parser';

describe('Resume Parser Timezone Boundaries', () => {
  it('rejects plain text with UTC date strings as invalid PDF', async () => {
    const resume = `
John Doe
john@example.com

Experience
Software Engineer 2020-2024 UTC
`;

    await expect(parseResume(Buffer.from(resume), 'application/pdf')).rejects.toThrow(
      'Invalid PDF structure'
    );
  });

  it('rejects plain text with EST date strings as invalid PDF', async () => {
    const resume = `
John Doe
john@example.com

Experience
Software Engineer 2020-2024 EST
`;

    await expect(parseResume(Buffer.from(resume), 'application/pdf')).rejects.toThrow(
      'Invalid PDF structure'
    );
  });

  it('rejects plain text with IST date strings as invalid PDF', async () => {
    const resume = `
John Doe
john@example.com

Education
University Degree 2019-2023 IST
`;

    await expect(parseResume(Buffer.from(resume), 'application/pdf')).rejects.toThrow(
      'Invalid PDF structure'
    );
  });

  it('rejects plain text with leap-year date references as invalid PDF', async () => {
    const resume = `
John Doe
john@example.com

Experience
Project Lead Feb 29 2024
`;

    await expect(parseResume(Buffer.from(resume), 'application/pdf')).rejects.toThrow(
      'Invalid PDF structure'
    );
  });

  it('rejects plain text with daylight-saving date text as invalid PDF', async () => {
    const resume = `
John Doe
john@example.com

Experience
Engineer March 10 2024 DST
`;

    await expect(parseResume(Buffer.from(resume), 'application/pdf')).rejects.toThrow(
      'Invalid PDF structure'
    );
  });
});
