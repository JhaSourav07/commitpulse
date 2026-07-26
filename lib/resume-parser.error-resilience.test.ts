import { describe, it, expect, vi } from 'vitest';
import { parseResume } from './resume-parser';

describe('resume-parser-error-resilience', () => {
  it('should handle non-printable characters gracefully by replacing them and parsing the remaining text', async () => {
    // \x00 is non-printable. It should be replaced with a space.
    const text = 'John Doe\n\x00\x01\x02john.doe@example.com\nSkills\nJavaScript, Python';
    const buffer = Buffer.from(text);
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john.doe@example.com');
    expect(result.skills).toContain('JavaScript');
    expect(result.skills).toContain('Python');
  });

  it('should throw an error/TypeError if the buffer is null or undefined (exception safety)', async () => {
    // Ensure that passing invalid parameters rejects or throws a TypeError rather than hanging
    await expect(parseResume(null as unknown as Buffer, 'application/pdf')).rejects.toThrow();
    await expect(parseResume(undefined as unknown as Buffer, 'application/pdf')).rejects.toThrow();
  });

  it('should not throw and handle corrupt/binary buffers by returning empty fields', async () => {
    // Binary/corrupt data that doesn't resemble a text resume
    const binaryData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
    ]);
    const result = await parseResume(binaryData, 'application/pdf');

    expect(result).toEqual({
      name: 'N/A',
      email: 'N/A',
      phone: 'N/A',
      skills: [],
      education: [],
      experience: [],
    });
  });

  it('should handle buffer toString failures gracefully (exception safety)', async () => {
    const mockBuffer = Buffer.from('Some text');
    vi.spyOn(mockBuffer, 'toString').mockImplementation(() => {
      throw new Error('Buffer conversion failed');
    });

    await expect(parseResume(mockBuffer, 'application/pdf')).rejects.toThrow(
      'Buffer conversion failed'
    );
    vi.restoreAllMocks();
  });

  it('should skip malformed education entries (e.g. invalid date ranges) instead of throwing', async () => {
    const text = `John Doe
Education
University of Toronto 201-202
Harvard College 2020 to invalid
MIT 2015 to 2019
`;
    const buffer = Buffer.from(text);
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.education).toEqual([
      {
        institution: 'MIT 2015 to 2019',
        degree: 'N/A',
        field: 'N/A',
        startDate: '2015',
        endDate: '2019',
      },
    ]);
  });

  it('should skip malformed experience entries instead of throwing', async () => {
    const text = `John Doe
Experience
Software Developer at Google (no date)
Intern at Apple 202 to present
Senior Engineer at Meta 2018 - 2021
`;
    const buffer = Buffer.from(text);
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.experience).toEqual([
      {
        company: 'Senior Engineer at Meta 2018 - 2021',
        role: 'N/A',
        startDate: '2018',
        endDate: '2021',
        description: 'N/A',
      },
    ]);
  });

  it('should handle extremely long single-word inputs without causing RegExp backtracking or crashing', async () => {
    const longWord = 'A'.repeat(10000);
    const text = `John Doe\n${longWord}@example.com\nSkills\n${longWord}`;
    const buffer = Buffer.from(text);

    const startTime = Date.now();
    const result = await parseResume(buffer, 'application/pdf');
    const duration = Date.now() - startTime;

    // Check that it didn't hang (completed within 500ms)
    expect(duration).toBeLessThan(2000);
    expect(result.name).toBe('John Doe');
    expect(result.email).toContain('@example.com');
  });
});
