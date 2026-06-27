// lib/resume-parser.timezone-boundaries.test.ts

import { describe, expect, it } from 'vitest';
import { parseResume } from './resume-parser';

describe('Resume Parser Timezone Boundaries', () => {
  it('parses resume data consistently with UTC date strings', async () => {
    const resume = `
John Doe
john@example.com

Experience
Software Engineer 2020-2024 UTC
`;

    const result = await parseResume(Buffer.from(resume), 'application/pdf');

    expect(result).toBeDefined();
    expect(typeof result.name).toBe('string');
  });

  it('parses resume data consistently with EST date strings', async () => {
    const resume = `
John Doe
john@example.com

Experience
Software Engineer 2020-2024 EST
`;

    const result = await parseResume(Buffer.from(resume), 'application/pdf');

    expect(result).toBeDefined();
    expect(result.experience).toBeDefined();
  });

  it('parses resume data consistently with IST date strings', async () => {
    const resume = `
John Doe
john@example.com

Education
University Degree 2019-2023 IST
`;

    const result = await parseResume(Buffer.from(resume), 'application/pdf');

    expect(result).toBeDefined();
    expect(result.education).toBeDefined();
  });

  it('handles leap-year date references without failures', async () => {
    const resume = `
John Doe
john@example.com

Experience
Project Lead Feb 29 2024
`;

    const result = await parseResume(Buffer.from(resume), 'application/pdf');

    expect(result).toBeDefined();
  });

  it('handles daylight-saving and boundary date text safely', async () => {
    const resume = `
John Doe
john@example.com

Experience
Engineer March 10 2024 DST
`;

    const result = await parseResume(Buffer.from(resume), 'application/pdf');

    expect(result).toBeDefined();
    expect(result.email).toBe('john@example.com');
  });
});
