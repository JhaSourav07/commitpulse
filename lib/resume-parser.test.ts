import { describe, it, expect } from 'vitest';
import { parseResume, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from './resume-parser';

describe('resume-parser', () => {
  it('parses a well formatted resume', async () => {
    const resume = `
John Doe
john.doe@example.com
+1 234-567-8901

Skills
TypeScript, React, Node.js

Education
B.Tech Computer Science 2020-2024

Experience
Software Engineer at ABC Corp 2022-2024
`;

    const result = await parseResume(Buffer.from(resume), 'application/pdf');

    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john.doe@example.com');
    expect(result.phone).toContain('234');
    expect(result.skills).toContain('TypeScript');
    expect(result.education).toHaveLength(1);
    expect(result.experience).toHaveLength(1);
  });

  it('extracts contact information correctly', async () => {
    const resume = `
Jane Smith
jane.smith@gmail.com
(555) 123-4567
`;

    const result = await parseResume(Buffer.from(resume), 'application/pdf');
    expect(result.name.length).toBeGreaterThan(0);
    expect(result.name).not.toMatch(/%PDF/i);

    expect(result.email).toBe('jane.smith@gmail.com');
    expect(result.phone).toContain('555');
  });

  it('extracts education and experience sections', async () => {
    const resume = `
Robert Brown

Education
University of Testing 2018-2022

Experience
Frontend Developer at XYZ 2022-2024
`;

    const result = await parseResume(Buffer.from(resume), 'application/pdf');

    expect(result.education).toEqual([
      expect.objectContaining({
        institution: 'University of Testing 2018-2022',
        startDate: '2018',
        endDate: '2022',
      }),
    ]);

    expect(result.experience).toEqual([
      expect.objectContaining({
        company: 'Frontend Developer at XYZ 2022-2024',
        startDate: '2022',
        endDate: '2024',
      }),
    ]);
  });

  it('handles empty or malformed resume text', async () => {
    const result = await parseResume(Buffer.from(''), 'application/pdf');

    expect(result).toEqual({
      name: '',
      email: '',
      phone: '',
      skills: [],
      education: [],
      experience: [],
    });
  });

  it('returns sensible fallbacks when sections are missing', async () => {
    const resume = `
Alex Johnson
alex@example.com

Random text without any section headers.
`;

    const result = await parseResume(Buffer.from(resume), 'application/pdf');

    expect(result.name).toBe('Alex Johnson');
    expect(result.email).toBe('alex@example.com');
    expect(result.skills).toEqual([]);
    expect(result.education).toEqual([]);
    expect(result.experience).toEqual([]);
  });

  it('filters corrupted skill tokens', async () => {
    const resume = `
John Doe
john@example.com

Skills
React, TypeScript, Node.js
?~ L8c n 7 ? ?
. ~ C _ 0o> ?
I f
m

Education
B.Tech 2020-2024
`;

    const result = await parseResume(Buffer.from(resume), 'text/plain');

    expect(result.skills).toEqual(['React', 'TypeScript', 'Node.js']);
  });

  it('preserves short valid skills', async () => {
    const resume = `
Skills

C, R, Go, AI, ML, Node.js, C++, C#, .NET

Education

B.Tech 2020-2024
`;

    const result = await parseResume(Buffer.from(resume), 'text/plain');

    expect(result.skills).toEqual(['C', 'R', 'Go', 'AI', 'ML', 'Node.js', 'C++', 'C#', '.NET']);
  });
});

describe('parser constants', () => {
  it('exports allowed mime types and max file size', () => {
    expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
    expect(ALLOWED_MIME_TYPES).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });
});
