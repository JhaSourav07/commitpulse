import { sanitizeFont, sanitizeGoogleFontUrl, validateGoogleFont } from '../lib/svg/sanitizer';

describe('sanitizeFont', () => {
  it('accepts valid font', () => expect(sanitizeFont('Orbitron')).toBe('Orbitron'));
  it('accepts spaces', () => expect(sanitizeFont('Fira Code')).toBe('Fira Code'));
  it('trims whitespace', () => expect(sanitizeFont('  Roboto  ')).toBe('Roboto'));
  it('returns null for empty', () => expect(sanitizeFont('')).toBeNull());
  it('returns null for null', () => expect(sanitizeFont(null)).toBeNull());
  it('strips injection chars', () =>
    expect(sanitizeFont('<script>alert(1)</script>')).toBe('scriptalert1script'));
});

describe('sanitizeGoogleFontUrl', () => {
  it('encodes spaces as +', () => expect(sanitizeGoogleFontUrl('Fira Code')).toBe('Fira+Code'));
  it('returns null for null', () => expect(sanitizeGoogleFontUrl(null)).toBeNull());
  it('returns null for empty', () => expect(sanitizeGoogleFontUrl('')).toBeNull());
});

describe('validateGoogleFont', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns font on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    expect(await validateGoogleFont('Orbitron')).toBe('Orbitron');
  });

  it('returns null on 400', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }));
    expect(await validateGoogleFont('BadFont')).toBeNull();
  });

  it('returns null for null input', async () => {
    expect(await validateGoogleFont(null)).toBeNull();
  });

  it('fails open on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    expect(await validateGoogleFont('Roboto')).toBe('Roboto');
  });
});
