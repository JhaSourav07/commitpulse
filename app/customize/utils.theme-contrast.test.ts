import { describe, expect, it } from 'vitest';
import type { CustomizeOptions } from './types';
import { buildQueryParams, getExportSnippet } from './utils';

const createOptions = (overrides: Partial<CustomizeOptions> = {}): CustomizeOptions =>
  ({
    username: 'vishva',
    theme: 'dark',
    bgHex: '',
    accentHex: '',
    textHex: '',
    scale: 'linear',
    speed: '8s',
    font: '',
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
    ...overrides,
  }) as CustomizeOptions;

describe('utils theme contrast', () => {
  it('preserves dark theme query parameter', () => {
    const query = buildQueryParams(createOptions({ theme: 'dark' }));

    expect(query).toContain('theme=dark');
  });

  it('preserves light theme query parameter', () => {
    const query = buildQueryParams(createOptions({ theme: 'light' }));

    expect(query).toContain('theme=light');
  });

  it('uses valid custom contrast colors when provided', () => {
    const query = buildQueryParams(
      createOptions({
        bgHex: '000000',
        textHex: 'ffffff',
        accentHex: '00ff00',
      })
    );

    expect(query).toContain('bg=000000');
    expect(query).toContain('text=ffffff');
    expect(query).toContain('accent=00ff00');
  });

  it('html export contains badge image markup', () => {
    const html = getExportSnippet('html', 'user=test&theme=dark');

    expect(html).toContain('<img');
    expect(html).toContain('theme=dark');
  });

  it('markdown export contains badge url for themed previews', () => {
    const markdown = getExportSnippet('markdown', 'user=test&theme=light');

    expect(markdown).toContain('theme=light');
    expect(markdown).toContain('CommitPulse');
  });
});
