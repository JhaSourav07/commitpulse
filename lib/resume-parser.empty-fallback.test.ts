import { describe, it, expect } from 'vitest';
import { parseResume } from './resume-parser';

describe('resume-parser-empty-fallback', () => {
  it('should reject empty buffer for PDF', async () => {
    const buffer = Buffer.from('');
    await expect(parseResume(buffer, 'application/pdf')).rejects.toThrow('PDF file too small');
  });

  it('should reject empty buffer for DOCX', async () => {
    const buffer = Buffer.from('');
    await expect(
      parseResume(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    ).rejects.toThrow('DOCX file too small');
  });

  it('should reject non-PDF buffer', async () => {
    const buffer = Buffer.from('   \n  \r\n   ');
    await expect(parseResume(buffer, 'application/pdf')).rejects.toThrow('Invalid PDF header');
  });

  it('should reject plain text as PDF', async () => {
    const text = 'John Doe\nSoftware Engineer\nNo contact info here';
    const buffer = Buffer.from(text);
    await expect(parseResume(buffer, 'application/pdf')).rejects.toThrow('Invalid PDF header');
  });

  it('should reject plain text as DOCX', async () => {
    const text = 'John Doe\nemail@com\n@domain.com\nusername@';
    const buffer = Buffer.from(text);
    await expect(
      parseResume(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    ).rejects.toThrow('Invalid DOCX/ZIP header');
  });

  it('should reject lowercase initials as PDF', async () => {
    const text = '12345 Random Line\nengineer@domain.com\nhttp://github.com/johndoe';
    const buffer = Buffer.from(text);
    await expect(parseResume(buffer, 'application/pdf')).rejects.toThrow('Invalid PDF header');
  });

  it('should reject text without phone as PDF', async () => {
    const text = 'John Doe\nSoftware Engineer\njohn@example.com';
    const buffer = Buffer.from(text);
    await expect(parseResume(buffer, 'application/pdf')).rejects.toThrow('Invalid PDF header');
  });

  it('should reject text without skills section as PDF', async () => {
    const text = 'John Doe\nSoftware Engineer\njohn@example.com';
    const buffer = Buffer.from(text);
    await expect(parseResume(buffer, 'application/pdf')).rejects.toThrow('Invalid PDF header');
  });

  it('should reject text with empty education section as PDF', async () => {
    const text = 'John Doe\nEducation\n\nExperience';
    const buffer = Buffer.from(text);
    await expect(parseResume(buffer, 'application/pdf')).rejects.toThrow('Invalid PDF header');
  });

  it('should reject text with empty experience section as PDF', async () => {
    const text = 'John Doe\nExperience\n\nEducation';
    const buffer = Buffer.from(text);
    await expect(parseResume(buffer, 'application/pdf')).rejects.toThrow('Invalid PDF header');
  });
});
