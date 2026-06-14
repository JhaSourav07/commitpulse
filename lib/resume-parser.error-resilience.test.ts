import { describe, it, expect, vi } from 'vitest';
import { parseResume } from './resume-parser';

describe('resume-parser-error-resilience', () => {
  it('should throw an error/TypeError if the buffer is null or undefined (exception safety)', async () => {
    await expect(parseResume(null as unknown as Buffer, 'application/pdf')).rejects.toThrow();
    await expect(parseResume(undefined as unknown as Buffer, 'application/pdf')).rejects.toThrow();
  });

  it('should reject corrupt/binary buffers that fail PDF validation', async () => {
    const binaryData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
    ]);
    await expect(parseResume(binaryData, 'application/pdf')).rejects.toThrow(
      'Invalid PDF structure'
    );
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

  it('should reject malformed PDFs instead of returning partial results', async () => {
    const text = `John Doe
Education
University of Toronto 201-202
Harvard College 2020 to invalid
MIT 2015 to 2019
`;
    const buffer = Buffer.from(text);
    await expect(parseResume(buffer, 'application/pdf')).rejects.toThrow('Invalid PDF structure');
  });

  it('should reject malformed DOCX instead of returning partial results', async () => {
    const text = `John Doe
Experience
Invalid date range here
Company A 2020-invalid
Company B 2018 to 2022
`;
    const buffer = Buffer.from(text);
    await expect(
      parseResume(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    ).rejects.toThrow('Invalid DOCX');
  });

  it('should not cause regex backtracking with extremely long words', async () => {
    const longWord = 'a'.repeat(10000);
    const text = `John Doe\n${longWord}@example.com\nSkills\nJavaScript`;
    const buffer = Buffer.from(text);
    await expect(parseResume(buffer, 'application/pdf')).rejects.toThrow('Invalid PDF structure');
  });
});
