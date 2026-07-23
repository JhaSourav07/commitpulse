import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { importConfig, exportConfig, CONFIG_SCHEMA_VERSION } from './utils';
import type { CustomizeOptions } from './types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FULL_OPTIONS: CustomizeOptions = {
  username: 'octocat',
  theme: 'dark',
  bgHex: 'ffffff',
  bgType: 'linear',
  bgStart: '000000',
  bgEnd: 'ffffff',
  bgAngle: 45,
  accentHex: 'ff0000',
  textHex: '00ff00',
  scale: 'log',
  speed: '4s',
  font: 'fira',
  year: '2024',
  radius: 12,
  size: 'large',
  hideTitle: true,
  hideBackground: false,
  hideStats: true,
  viewMode: 'monthly',
  deltaFormat: 'absolute',
  badgeWidth: 600,
  badgeHeight: 300,
  grace: 3,
  language: 'es',
  timezone: 'America/New_York',
};

const EMPTY_OPTIONS: CustomizeOptions = {
  username: '',
  theme: 'dark',
  bgHex: '',
  bgType: 'solid',
  bgStart: '',
  bgEnd: '',
  bgAngle: 90,
  accentHex: '',
  textHex: '',
  scale: 'linear',
  speed: '8s',
  font: 'Inter',
  year: '',
  radius: 8,
  size: 'medium',
  hideTitle: false,
  hideBackground: false,
  hideStats: false,
  viewMode: 'default',
  deltaFormat: 'percent',
  badgeWidth: '',
  badgeHeight: '',
  grace: 1,
  language: 'en',
  timezone: 'UTC',
};

function makeRaw(options: CustomizeOptions, version: number = CONFIG_SCHEMA_VERSION): string {
  return JSON.stringify({ version, config: options });
}

// ─── importConfig ─────────────────────────────────────────────────────────────

describe('importConfig', () => {
  describe('success — round-trip fidelity', () => {
    it('restores a fully-populated config exactly', () => {
      const raw = makeRaw(FULL_OPTIONS);
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options).toEqual(FULL_OPTIONS);
    });

    it('restores an all-default (empty) config exactly', () => {
      const raw = makeRaw(EMPTY_OPTIONS);
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options).toEqual(EMPTY_OPTIONS);
    });

    it('silently ignores unknown fields in the config object', () => {
      const withExtra = { ...FULL_OPTIONS, unknownFutureProp: 'surprise' };
      const raw = JSON.stringify({ version: 1, config: withExtra });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(Object.keys(result.options)).not.toContain('unknownFutureProp');
    });

    it('accepts badgeWidth and badgeHeight as empty string', () => {
      const opts: CustomizeOptions = { ...FULL_OPTIONS, badgeWidth: '', badgeHeight: '' };
      const raw = makeRaw(opts);
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.badgeWidth).toBe('');
      expect(result.options.badgeHeight).toBe('');
    });

    it('accepts badgeWidth and badgeHeight as integers', () => {
      const opts: CustomizeOptions = { ...FULL_OPTIONS, badgeWidth: 800, badgeHeight: 400 };
      const raw = makeRaw(opts);
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.badgeWidth).toBe(800);
      expect(result.options.badgeHeight).toBe(400);
    });
  });

  describe('failure — invalid JSON', () => {
    it('returns an error for completely invalid JSON', () => {
      const result = importConfig('not-json!!!');
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected success');
      expect(result.error).toMatch(/invalid json/i);
    });

    it('returns an error for truncated JSON', () => {
      const result = importConfig('{"version": 1, "config": {');
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected success');
      expect(result.error).toMatch(/invalid json/i);
    });

    it('returns an error for an empty string', () => {
      const result = importConfig('');
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected success');
    });
  });

  describe('failure — invalid top-level shape', () => {
    it('returns an error when the top level is an array', () => {
      const result = importConfig(JSON.stringify([{ version: 1, config: FULL_OPTIONS }]));
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected success');
      expect(result.error).toMatch(/json object/i);
    });

    it('returns an error when the top level is a string', () => {
      const result = importConfig(JSON.stringify('hello'));
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected success');
    });

    it('returns an error when the top level is null', () => {
      const result = importConfig(JSON.stringify(null));
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected success');
    });
  });

  describe('failure — missing required fields', () => {
    it('returns an error when "version" is missing', () => {
      const raw = JSON.stringify({ config: FULL_OPTIONS });
      const result = importConfig(raw);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected success');
      expect(result.error).toMatch(/version/i);
    });

    it('returns an error when "config" is missing', () => {
      const raw = JSON.stringify({ version: 1 });
      const result = importConfig(raw);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected success');
      expect(result.error).toMatch(/config/i);
    });

    it('returns an error when "config" is null', () => {
      const raw = JSON.stringify({ version: 1, config: null });
      const result = importConfig(raw);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected success');
      expect(result.error).toMatch(/config/i);
    });
  });

  describe('failure — wrong schema version', () => {
    it('returns an error for version 2', () => {
      const raw = makeRaw(FULL_OPTIONS, 2);
      const result = importConfig(raw);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected success');
      expect(result.error).toMatch(/version/i);
      expect(result.error).toContain('2');
    });

    it('returns an error for version 0', () => {
      const raw = makeRaw(FULL_OPTIONS, 0);
      const result = importConfig(raw);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected success');
    });

    it('returns an error for a string version like "v1"', () => {
      const raw = JSON.stringify({ version: 'v1', config: FULL_OPTIONS });
      const result = importConfig(raw);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected success');
    });
  });

  describe('graceful degradation — invalid field values fall back to defaults', () => {
    it('falls back to default theme when theme is empty string', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, theme: '' });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.theme).toBe('dark');
    });

    it('falls back to "linear" scale for unrecognised scale value', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, scale: 'exponential' as 'linear' });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.scale).toBe('linear');
    });

    it('falls back to "8s" speed for unrecognised speed value', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, speed: '99s' });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.speed).toBe('8s');
    });

    it('falls back to "medium" size for unrecognised size', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, size: 'xl' as 'medium' });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.size).toBe('medium');
    });

    it('falls back to default radius (8) for out-of-range radius', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, radius: 9999 });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.radius).toBe(8);
    });

    it('falls back to default bgAngle (90) for out-of-range angle', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, bgAngle: 999 });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.bgAngle).toBe(90);
    });

    it('falls back to default grace (1) for out-of-range grace', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, grace: 99 });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.grace).toBe(1);
    });

    it('falls back to "solid" bgType for unrecognised bgType', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, bgType: 'diagonal' as 'solid' });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.bgType).toBe('solid');
    });

    it('falls back to "default" viewMode for unrecognised viewMode', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, viewMode: 'galaxy' as 'default' });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.viewMode).toBe('default');
    });

    it('falls back to "percent" deltaFormat for unrecognised deltaFormat', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, deltaFormat: 'ratio' as 'percent' });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.deltaFormat).toBe('percent');
    });

    it('falls back to "en" language for unrecognised language', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, language: 'klingon' as 'en' });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.language).toBe('en');
    });

    it('falls back to "UTC" timezone for unrecognised timezone', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, timezone: 'Mars/Olympus' as 'UTC' });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.timezone).toBe('UTC');
    });

    it('falls back to false for non-boolean hideTitle', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, hideTitle: 'yes' as unknown as boolean });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.hideTitle).toBe(false);
    });

    it('falls back to empty string badgeWidth for non-numeric value', () => {
      const raw = makeRaw({ ...FULL_OPTIONS, badgeWidth: 'auto' as unknown as number });
      const result = importConfig(raw);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options.badgeWidth).toBe('');
    });

    it('handles entirely missing optional fields by using defaults', () => {
      const minimal = { version: 1, config: {} };
      const result = importConfig(JSON.stringify(minimal));
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected failure');
      expect(result.options).toEqual(EMPTY_OPTIONS);
    });
  });
});

// ─── exportConfig ────────────────────────────────────────────────────────────

describe('exportConfig', () => {
  let createdUrl: string;
  let downloadAnchor: HTMLAnchorElement | null = null;

  beforeEach(() => {
    createdUrl = 'blob:mock-url';

    vi.stubGlobal(
      'URL',
      class {
        static createObjectURL = vi.fn(() => createdUrl);
        static revokeObjectURL = vi.fn();
      }
    );

    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        downloadAnchor = originalCreate('a') as HTMLAnchorElement;
        vi.spyOn(downloadAnchor, 'click').mockImplementation(() => {});
        return downloadAnchor;
      }
      return originalCreate(tag);
    });

    vi.spyOn(document.body, 'appendChild').mockImplementation((el) => el);
    vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    downloadAnchor = null;
  });

  it('triggers a download with filename "commitpulse-config.json"', () => {
    exportConfig(FULL_OPTIONS);
    expect(downloadAnchor).not.toBeNull();
    expect(downloadAnchor!.download).toBe('commitpulse-config.json');
  });

  it('includes version 1 and the full config in the downloaded JSON', () => {
    let capturedJson = '';
    const OrigBlob = globalThis.Blob;
    vi.stubGlobal(
      'Blob',
      class extends OrigBlob {
        constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
          super(parts, opts);
          capturedJson = parts[0] as string;
        }
      }
    );

    exportConfig(FULL_OPTIONS);

    const parsed = JSON.parse(capturedJson) as { version: number; config: CustomizeOptions };
    expect(parsed.version).toBe(CONFIG_SCHEMA_VERSION);
    expect(parsed.config).toEqual(FULL_OPTIONS);
  });

  it('produces valid JSON that importConfig can round-trip', () => {
    let capturedJson = '';
    const OrigBlob = globalThis.Blob;
    vi.stubGlobal(
      'Blob',
      class extends OrigBlob {
        constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
          super(parts, opts);
          capturedJson = parts[0] as string;
        }
      }
    );

    exportConfig(FULL_OPTIONS);

    const result = importConfig(capturedJson);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unexpected failure');
    expect(result.options).toEqual(FULL_OPTIONS);
  });

  it('works correctly for an empty/default config', () => {
    let capturedJson = '';
    const OrigBlob = globalThis.Blob;
    vi.stubGlobal(
      'Blob',
      class extends OrigBlob {
        constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
          super(parts, opts);
          capturedJson = parts[0] as string;
        }
      }
    );

    exportConfig(EMPTY_OPTIONS);

    const result = importConfig(capturedJson);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unexpected failure');
    expect(result.options).toEqual(EMPTY_OPTIONS);
  });

  it('cleans up the temporary anchor and revokes the object URL', () => {
    exportConfig(FULL_OPTIONS);
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(createdUrl);
  });
});
