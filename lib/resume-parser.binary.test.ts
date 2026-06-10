import { describe, it, expect, vi } from 'vitest';
import { parseResume } from './resume-parser';

vi.mock('pdf-parse', () => {
  const mockFn = vi.fn().mockResolvedValue({
    text: `John Doe\njohn.doe@example.com\n+1 234-567-8901\nSkills\nTypeScript, React, Node.js\nEducation\nB.Tech Computer Science 2020-2024\nExperience\nSoftware Engineer at ABC Corp 2022-2024`,
  });
  return {
    default: mockFn,
    __esModule: true,
  };
});

vi.mock('mammoth', () => {
  return {
    default: {
      extractRawText: vi.fn().mockResolvedValue({
        value: `Jane Smith\njane.smith@gmail.com\n(555) 123-4567\nSkills\nPython, Docker, AWS\nEducation\nBS Mathematics 2018-2022\nExperience\nDevOps Engineer at XYZ 2022-2024`,
      }),
    },
  };
});

describe('resume-parser binary document parsing', () => {
  it('correctly uses pdf-parse when parsing a valid PDF buffer', async () => {
    // A mock PDF buffer starts with "%PDF"
    const buffer = Buffer.from('%PDF-1.4\nSome binary content');
    const result = await parseResume(buffer, 'application/pdf');

    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john.doe@example.com');
    expect(result.phone).toBe('+1 234-567-8901');
    expect(result.skills).toContain('TypeScript');
    expect(result.education).toHaveLength(1);
    expect(result.experience).toHaveLength(1);
  });

  it('correctly uses mammoth when parsing a valid DOCX buffer', async () => {
    // A mock DOCX/ZIP container starts with "PK"
    const buffer = Buffer.from('PK\x03\x04\nSome binary docx zip content');
    const result = await parseResume(
      buffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    expect(result.name).toBe('Jane Smith');
    expect(result.email).toBe('jane.smith@gmail.com');
    expect(result.phone).toBe('(555) 123-4567');
    expect(result.skills).toContain('Python');
    expect(result.education).toHaveLength(1);
    expect(result.experience).toHaveLength(1);
  });
});
