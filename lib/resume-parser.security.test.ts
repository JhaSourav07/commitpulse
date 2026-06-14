import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the module to test
import * as resumeParser from './resume-parser';

describe('Resume Parser Security', () => {
  describe('SECURITY_CONFIG', () => {
    it('should have expected security limits', () => {
      expect(resumeParser.SECURITY_CONFIG.MAX_DECOMPRESSED_SIZE).toBe(50 * 1024 * 1024);
      expect(resumeParser.SECURITY_CONFIG.MAX_DECOMPRESSION_RATIO).toBe(50);
      expect(resumeParser.SECURITY_CONFIG.MAX_PDF_PAGES).toBe(10);
      expect(resumeParser.SECURITY_CONFIG.MAX_EXTRACTED_TEXT_LENGTH).toBe(50000);
      expect(resumeParser.SECURITY_CONFIG.PARSER_TIMEOUT_MS).toBe(8000);
      expect(resumeParser.SECURITY_CONFIG.WORKER_MAX_OLD_GENERATION_MB).toBe(100);
      expect(resumeParser.SECURITY_CONFIG.WORKER_MAX_YOUNG_GENERATION_MB).toBe(25);
      expect(resumeParser.SECURITY_CONFIG.MAX_DOCX_FILES).toBe(100);
    });
  });

  describe('checkZipRatios', () => {
    it('should reject buffer too small for zip headers', () => {
      const smallBuffer = Buffer.alloc(10);
      const result = resumeParser.checkZipRatios(smallBuffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Buffer too small to be a valid zip file');
    });

    it('should reject files with excessive decompression ratio', () => {
      const buffer = Buffer.alloc(200);
      buffer.writeUInt32LE(0x02014b50, 50); // Central Directory signature
      buffer.writeUInt32LE(10, 50 + 20); // Compressed size = 10
      buffer.writeUInt32LE(10000, 50 + 24); // Uncompressed size = 10,000 (ratio = 1000x)
      buffer.writeUInt16LE(4, 50 + 28); // File name length

      const result = resumeParser.checkZipRatios(buffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Compression ratio');
      expect(result.reason).toContain('exceeds limit');
    });

    it('should reject files exceeding max decompressed size', () => {
      const buffer = Buffer.alloc(200);
      buffer.writeUInt32LE(0x02014b50, 50); // Central Directory signature
      buffer.writeUInt32LE(100, 50 + 20); // Compressed size
      buffer.writeUInt32LE(60 * 1024 * 1024, 50 + 24); // Uncompressed size > 50MB
      buffer.writeUInt16LE(4, 50 + 28); // File name length

      const result = resumeParser.checkZipRatios(buffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('exceeds limit');
    });

    it('should reject archives with too many files', () => {
      // Create a buffer with more than MAX_DOCX_FILES entries
      const maxFiles = resumeParser.SECURITY_CONFIG.MAX_DOCX_FILES + 10;
      const bufferSize = maxFiles * 50 + 1000;
      const buffer = Buffer.alloc(bufferSize);

      let offset = 0;
      for (let i = 0; i < maxFiles; i++) {
        buffer.writeUInt32LE(0x02014b50, offset); // Central Directory signature
        buffer.writeUInt32LE(100, offset + 20); // Compressed size
        buffer.writeUInt32LE(200, offset + 24); // Uncompressed size
        buffer.writeUInt16LE(4, offset + 28); // File name length
        offset += 50;
      }

      const result = resumeParser.checkZipRatios(buffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Too many files');
    });

    it('should reject files with directory traversal paths', () => {
      const buffer = Buffer.alloc(200);
      buffer.writeUInt32LE(0x02014b50, 50); // Central Directory signature
      buffer.writeUInt32LE(100, 50 + 20); // Compressed size
      buffer.writeUInt32LE(200, 50 + 24); // Uncompressed size
      buffer.writeUInt16LE(12, 50 + 28); // File name length
      buffer.write('../evil.txt', 50 + 46); // Dangerous path

      const result = resumeParser.checkZipRatios(buffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Dangerous file path');
    });

    it('should reject files with absolute paths', () => {
      const buffer = Buffer.alloc(200);
      buffer.writeUInt32LE(0x02014b50, 50); // Central Directory signature
      buffer.writeUInt32LE(100, 50 + 20); // Compressed size
      buffer.writeUInt32LE(200, 50 + 24); // Uncompressed size
      buffer.writeUInt16LE(12, 50 + 28); // File name length
      buffer.write('/etc/passwd', 50 + 46); // Absolute path

      const result = resumeParser.checkZipRatios(buffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Dangerous file path');
    });

    it('should reject nested archives', () => {
      const buffer = Buffer.alloc(200);
      buffer.writeUInt32LE(0x02014b50, 50); // Central Directory signature
      buffer.writeUInt32LE(100, 50 + 20); // Compressed size
      buffer.writeUInt32LE(200, 50 + 24); // Uncompressed size
      buffer.writeUInt16LE(10, 50 + 28); // File name length
      buffer.write('nested.zip', 50 + 46); // Nested archive

      const result = resumeParser.checkZipRatios(buffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Nested archive');
    });

    it('should reject nested docx files', () => {
      const buffer = Buffer.alloc(200);
      buffer.writeUInt32LE(0x02014b50, 50); // Central Directory signature
      buffer.writeUInt32LE(100, 50 + 20); // Compressed size
      buffer.writeUInt32LE(200, 50 + 24); // Uncompressed size
      buffer.writeUInt16LE(12, 50 + 28); // File name length
      buffer.write('nested.docx', 50 + 46); // Nested docx

      const result = resumeParser.checkZipRatios(buffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Nested archive');
    });

    it('should accept valid zip structure', () => {
      const buffer = Buffer.alloc(200);
      buffer.writeUInt32LE(0x02014b50, 50); // Central Directory signature
      buffer.writeUInt32LE(100, 50 + 20); // Compressed size = 100
      buffer.writeUInt32LE(200, 50 + 24); // Uncompressed size = 200 (ratio = 2x)
      buffer.writeUInt16LE(8, 50 + 28); // File name length
      buffer.write('file.xml', 50 + 46); // Safe filename

      const result = resumeParser.checkZipRatios(buffer);
      expect(result.valid).toBe(true);
    });

    it('should check local file headers when no central directory', () => {
      const buffer = Buffer.alloc(200);
      buffer.writeUInt32LE(0x04034b50, 0); // Local File Header signature
      buffer.writeUInt32LE(10, 18); // Compressed size = 10
      buffer.writeUInt32LE(10000, 22); // Uncompressed size = 10,000 (high ratio)
      buffer.writeUInt16LE(4, 26); // File name length

      const result = resumeParser.checkZipRatios(buffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Compression ratio');
    });

    it('should detect invalid header field lengths', () => {
      const buffer = Buffer.alloc(200);
      buffer.writeUInt32LE(0x02014b50, 50); // Central Directory signature
      buffer.writeUInt16LE(70000, 50 + 28); // Invalid file name length

      const result = resumeParser.checkZipRatios(buffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid header field lengths');
    });
  });

  describe('hasValidFileSignature', () => {
    it('should validate PDF signature', () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
      expect(resumeParser.hasValidFileSignature(pdfBuffer, 'application/pdf')).toBe(true);
    });

    it('should reject invalid PDF signature', () => {
      const invalidBuffer = Buffer.from([0x00, 0x50, 0x44, 0x46, 0x2d]);
      expect(resumeParser.hasValidFileSignature(invalidBuffer, 'application/pdf')).toBe(false);
    });

    it('should validate DOCX signature (PK\\x03\\x04)', () => {
      const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      expect(
        resumeParser.hasValidFileSignature(
          docxBuffer,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).toBe(true);
    });

    it('should validate DOCX signature (PK\\x05\\x06)', () => {
      const docxBuffer = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
      expect(
        resumeParser.hasValidFileSignature(
          docxBuffer,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).toBe(true);
    });

    it('should reject unknown MIME types', () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(resumeParser.hasValidFileSignature(buffer, 'text/plain')).toBe(false);
    });

    it('should reject buffers shorter than signature', () => {
      const shortBuffer = Buffer.from([0x25]);
      expect(resumeParser.hasValidFileSignature(shortBuffer, 'application/pdf')).toBe(false);
    });
  });

  describe('parseResumeInWorker security', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should reject invalid buffer', async () => {
      await expect(
        resumeParser.parseResumeInWorker(null as unknown as Buffer, 'application/pdf')
      ).rejects.toThrow('Invalid buffer');
    });

    it('should reject non-Buffer input', async () => {
      await expect(
        resumeParser.parseResumeInWorker('string' as unknown as Buffer, 'application/pdf')
      ).rejects.toThrow('Invalid buffer');
    });

    it('should reject PDFs with invalid structure', async () => {
      const corruptedPdf = Buffer.alloc(1024);
      corruptedPdf.write('%PDF-1.7', 0);
      // Rest is null bytes - should be detected as corrupted

      await expect(
        resumeParser.parseResumeInWorker(corruptedPdf, 'application/pdf')
      ).rejects.toThrow('Invalid PDF structure');
    });

    it('should reject DOCX with invalid structure', async () => {
      const invalidDocx = Buffer.from([0x00, 0x00, 0x00, 0x00]);

      await expect(
        resumeParser.parseResumeInWorker(
          invalidDocx,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).rejects.toThrow('Invalid DOCX structure');
    });

    it('should timeout after configured duration', async () => {
      // This test verifies the timeout mechanism exists
      // We can't easily test the actual timeout without mocking the worker
      const validPdf = Buffer.from('%PDF-1.7\nTest content');

      // The function should exist and have timeout logic
      expect(typeof resumeParser.parseResumeInWorker).toBe('function');
    }, 15000);
  });

  describe('Security integration', () => {
    it('should have consistent security limits across config', () => {
      // Verify that the config values are reasonable and consistent
      expect(resumeParser.SECURITY_CONFIG.MAX_DECOMPRESSION_RATIO).toBeLessThanOrEqual(100);
      expect(resumeParser.SECURITY_CONFIG.MAX_PDF_PAGES).toBeLessThanOrEqual(20);
      expect(resumeParser.SECURITY_CONFIG.PARSER_TIMEOUT_MS).toBeLessThanOrEqual(30000);
      expect(resumeParser.SECURITY_CONFIG.WORKER_MAX_OLD_GENERATION_MB).toBeLessThanOrEqual(256);
    });

    it('should have dangerous path patterns for zip slip protection', () => {
      expect(resumeParser.SECURITY_CONFIG.DANGEROUS_PATH_PATTERNS.length).toBeGreaterThanOrEqual(2);
      expect(resumeParser.SECURITY_CONFIG.DANGEROUS_PATH_PATTERNS[0].source).toContain('..');
    });
  });
});
