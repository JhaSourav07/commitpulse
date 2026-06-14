import { describe, it, expect } from 'vitest';
import { parseResume, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from './resume-parser';

describe('resume-parser', () => {
  it('rejects plain text buffer as PDF (requires valid PDF structure)', async () => {
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

    await expect(parseResume(Buffer.from(resume), 'application/pdf')).rejects.toThrow(
      'Invalid PDF structure'
    );
  });

  it('rejects plain text buffer as DOCX (requires valid DOCX structure)', async () => {
    const resume = `
Jane Smith
jane.smith@gmail.com
(555) 123-4567
`;

    await expect(
      parseResume(
        Buffer.from(resume),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    ).rejects.toThrow('Invalid DOCX');
  });

  it('rejects empty buffer as PDF', async () => {
    await expect(parseResume(Buffer.from(''), 'application/pdf')).rejects.toThrow(
      'PDF file too small'
    );
  });

  it('rejects empty buffer as DOCX', async () => {
    await expect(
      parseResume(
        Buffer.from(''),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    ).rejects.toThrow('DOCX file too small');
  });

  it('rejects plain text without section headers as PDF', async () => {
    const resume = `
Alex Johnson
alex@example.com

Random text without any section headers.
`;

    await expect(parseResume(Buffer.from(resume), 'application/pdf')).rejects.toThrow(
      'Invalid PDF structure'
    );
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
