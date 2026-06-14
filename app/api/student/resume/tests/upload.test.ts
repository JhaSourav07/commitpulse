import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../upload/route';

vi.mock('@/lib/rate-limit', () => {
  class MockRateLimiter {
    check = vi.fn().mockResolvedValue(true);
  }

  return {
    RateLimiter: MockRateLimiter,
  };
});

// Build the handler request directly from a real File/FormData so the file bytes are
// preserved (the multipart transport itself is Next.js's responsibility, not this route's).
function makeUploadRequest(
  content: string | number[],
  type: string,
  name = 'resume.pdf',
  size?: number
): Request {
  const data = typeof content === 'string' ? content : new Uint8Array(content);
  const file = new File([data], name, { type });
  // Override size if specified
  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size, writable: false });
  }
  const form = new FormData();
  form.append('resume', file);

  return {
    headers: new Headers(),
    formData: async () => form,
  } as unknown as Request;
}

describe('POST /api/student/resume/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic validation tests
  it('returns 400 for a disallowed mime type', async () => {
    const response = await POST(makeUploadRequest('hello', 'text/html', 'note.html'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid file type');
  });

  it('returns 400 when content does not match the declared PDF type', async () => {
    const response = await POST(
      makeUploadRequest('<!DOCTYPE html><html></html>', 'application/pdf', 'evil.pdf')
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('does not match');
  });

  it('accepts a file whose bytes match the declared PDF type', async () => {
    const response = await POST(
      makeUploadRequest('%PDF-1.7\nJohn Doe\njohn@example.com', 'application/pdf')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  // File size validation tests
  it('returns 400 when file is too small', async () => {
    const response = await POST(makeUploadRequest('123', 'application/pdf', 'tiny.pdf', 3));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('too small');
  });

  it('returns 400 when file size exceeds limit', async () => {
    const largeContent = 'A'.repeat(6 * 1024 * 1024); // 6MB
    const response = await POST(
      makeUploadRequest(
        '%PDF-1.7\n' + largeContent,
        'application/pdf',
        'large.pdf',
        6 * 1024 * 1024
      )
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('exceeds');
  });

  // File extension validation tests
  it('returns 400 when file extension does not match MIME type', async () => {
    const response = await POST(
      makeUploadRequest('%PDF-1.7\ncontent', 'application/pdf', 'document.docx')
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('extension does not match');
  });

  it('accepts valid PDF with correct extension', async () => {
    const response = await POST(
      makeUploadRequest('%PDF-1.7\nJohn Doe\njohn@example.com', 'application/pdf', 'resume.pdf')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('accepts valid DOCX with correct extension', async () => {
    const mockValidDocx = Buffer.alloc(200);
    mockValidDocx.writeUInt32LE(0x04034b50, 0);
    mockValidDocx.writeUInt32LE(0x02014b50, 50);
    mockValidDocx.writeUInt32LE(100, 50 + 20);
    mockValidDocx.writeUInt32LE(200, 50 + 24);
    mockValidDocx.writeUInt16LE(4, 50 + 28);

    const response = await POST(
      makeUploadRequest(
        Array.from(mockValidDocx),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'resume.docx'
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  // Zip bomb detection tests
  it('rejects a DOCX/ZIP file containing a zip bomb (high decompression ratio)', async () => {
    const mockZipBomb = Buffer.alloc(200);
    mockZipBomb.writeUInt32LE(0x04034b50, 0); // Local Header signature
    mockZipBomb.writeUInt32LE(0x02014b50, 50); // Central Directory signature
    mockZipBomb.writeUInt32LE(10, 50 + 20); // Compressed size = 10
    mockZipBomb.writeUInt32LE(10000, 50 + 24); // Uncompressed size = 10,000 (ratio = 1000x > 50x limit)
    mockZipBomb.writeUInt16LE(4, 50 + 28); // File name length = 4

    const response = await POST(
      makeUploadRequest(
        Array.from(mockZipBomb),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'bomb.docx'
      )
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Failed to parse resume');
  });

  it('accepts a valid DOCX structure with normal decompression ratio', async () => {
    const mockValidDocx = Buffer.alloc(200);
    mockValidDocx.writeUInt32LE(0x04034b50, 0); // Local Header signature
    mockValidDocx.writeUInt32LE(0x02014b50, 50); // Central Directory signature
    mockValidDocx.writeUInt32LE(100, 50 + 20); // Compressed size = 100
    mockValidDocx.writeUInt32LE(200, 50 + 24); // Uncompressed size = 200 (ratio = 2x)
    mockValidDocx.writeUInt16LE(4, 50 + 28); // File name length = 4

    const response = await POST(
      makeUploadRequest(
        Array.from(mockValidDocx),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'valid.docx'
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  // Filename sanitization tests
  it('sanitizes filenames with path traversal attempts', async () => {
    const response = await POST(
      makeUploadRequest('%PDF-1.7\ncontent', 'application/pdf', '../../../etc/passwd.pdf')
    );
    const body = await response.json();

    // Should succeed but with sanitized filename
    expect(response.status).toBe(200);
    expect(body.fileName).not.toContain('..');
    expect(body.fileName).not.toContain('/');
  });

  it('sanitizes filenames with special characters', async () => {
    const response = await POST(
      makeUploadRequest(
        '%PDF-1.7\ncontent',
        'application/pdf',
        'resume<script>alert(1)</script>.pdf'
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.fileName).not.toContain('<');
    expect(body.fileName).not.toContain('>');
  });

  // Encrypted PDF detection tests
  it('rejects encrypted PDFs', async () => {
    // Create a PDF with encryption marker
    const encryptedPdf = '%PDF-1.7\n/Encrypt\nsome content';
    const response = await POST(
      makeUploadRequest(encryptedPdf, 'application/pdf', 'encrypted.pdf')
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Encrypted');
  });

  // Timeout tests
  it('returns 422 if the resume parser times out', async () => {
    const resumeParser = await import('@/lib/resume-parser');
    const spy = vi
      .spyOn(resumeParser, 'parseResume')
      .mockRejectedValue(new Error('Parser timeout: parsing took longer than 8 seconds.'));

    const response = await POST(
      makeUploadRequest('%PDF-1.7\nJohn Doe\njohn@example.com', 'application/pdf')
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Failed to parse resume');

    spy.mockRestore();
  });

  // Invalid structure tests
  it('rejects PDFs with invalid structure', async () => {
    // PDF header but mostly null bytes
    const corruptedPdf = Buffer.alloc(1024);
    corruptedPdf.write('%PDF-1.7', 0);
    // Rest is null bytes

    const response = await POST(
      makeUploadRequest(Array.from(corruptedPdf), 'application/pdf', 'corrupted.pdf')
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
  });

  it('rejects DOCX with invalid structure', async () => {
    // Invalid ZIP header
    const invalidDocx = Buffer.from([0x00, 0x00, 0x00, 0x00]);

    const response = await POST(
      makeUploadRequest(
        Array.from(invalidDocx),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'invalid.docx'
      )
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
  });
});
