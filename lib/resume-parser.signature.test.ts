import { describe, it, expect } from 'vitest';
import { hasValidFileSignature } from './resume-parser';

const PDF = 'application/pdf';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOC = 'application/msword';

describe('hasValidFileSignature', () => {
  it('accepts a real PDF signature', () => {
    expect(hasValidFileSignature(Buffer.from('%PDF-1.7\nstream'), PDF)).toBe(true);
  });

  it('rejects HTML content disguised as a PDF', () => {
    expect(hasValidFileSignature(Buffer.from('<!DOCTYPE html><html></html>'), PDF)).toBe(false);
  });

  it('accepts a DOCX (zip) signature', () => {
    expect(hasValidFileSignature(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14]), DOCX)).toBe(true);
  });

  it('rejects non-zip content disguised as a DOCX', () => {
    expect(hasValidFileSignature(Buffer.from('plain text, not a zip'), DOCX)).toBe(false);
  });

  it('accepts a legacy DOC (OLE2) signature', () => {
    expect(
      hasValidFileSignature(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), DOC)
    ).toBe(true);
  });

  it('rejects an unknown mime type even with valid-looking bytes', () => {
    expect(hasValidFileSignature(Buffer.from('%PDF-1.7'), 'text/html')).toBe(false);
  });

  it('rejects a buffer shorter than the signature', () => {
    expect(hasValidFileSignature(Buffer.from([0x25, 0x50]), PDF)).toBe(false);
  });

  it('rejects an empty buffer', () => {
    expect(hasValidFileSignature(Buffer.from([]), PDF)).toBe(false);
  });
});
