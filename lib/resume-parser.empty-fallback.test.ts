import { describe, it, expect } from 'vitest';
import { parseResume } from './resume-parser';

describe('resume-parser-empty-fallback', () => {
  it('should return empty fields when the buffer is completely empty', async () => {
    const buffer = Buffer.from('');
    const result = await parseResume(buffer, 'application/pdf');

    expect(result).toEqual({
      name: '',
      email: '',
      phone: '',
      skills: [],
      education: [],
      experience: [],
    });
  });

  it('should return empty fields when the buffer contains only whitespace and newlines', async () => {
    const buffer = Buffer.from('   \n  \r\n   ');
    const result = await parseResume(buffer, 'application/pdf');

    expect(result).toEqual({
      name: '',
      email: '',
      phone: '',
      skills: [],
      education: [],
      experience: [],
    });
  });

  it('should return empty email if no email matches the regex', async () => {
    const text = 'John Doe\nSoftware Engineer\nNo contact info here';
    const buffer = Buffer.from(text);
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.email).toBe('');
  });

  it('should return empty email if email is malformed', async () => {
    const text = 'John Doe\nemail@com\n@domain.com\nusername@';
    const buffer = Buffer.from(text);
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.email).toBe('');
  });

  it('should return empty name if first few lines do not match name regex', async () => {
    const text = '12345 Random Line\nengineer@domain.com\nhttp://github.com/johndoe';
    const buffer = Buffer.from(text);
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.name).toBe('');
  });

  it('should return empty name if first lines have lowercase initials only', async () => {
    const text = 'john doe\nsoftware developer';
    const buffer = Buffer.from(text);
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.name).toBe('');
  });

  it('should return empty phone if phone is missing or contains invalid characters', async () => {
    const text = 'John Doe\njohn.doe@example.com\nPhone: abc-def-ghij';
    const buffer = Buffer.from(text);
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.phone).toBe('');
  });

  it('should return empty skills if no skills section header is present', async () => {
    const text = 'John Doe\nHere are some of my tools: Git, JavaScript';
    const buffer = Buffer.from(text);
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.skills).toEqual([]);
  });

  it('should handle empty section content when section header is present but followed immediately by another section', async () => {
    const text = `John Doe
Skills
Education
University of Toronto 2018 - 2022
`;
    const buffer = Buffer.from(text);
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.skills).toEqual([]);
    expect(result.education).toEqual([
      {
        institution: 'University of Toronto 2018 - 2022',
        degree: '',
        field: '',
        startDate: '2018',
        endDate: '2022',
      },
    ]);
  });

  it('should return empty education list when education section is missing or date is missing', async () => {
    const text = `John Doe
Education
University of Toronto
No date here
`;
    const buffer = Buffer.from(text);
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.education).toEqual([]);
  });

  it('should return empty experience list when experience section is missing or date is missing', async () => {
    const text = `John Doe
Experience
Software Developer at Google
No date mentioned
`;
    const buffer = Buffer.from(text);
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.experience).toEqual([]);
  });
});
