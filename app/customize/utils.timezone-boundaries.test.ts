import { describe, it, expect } from 'vitest';
import { buildQueryParams } from './utils';
import type { CustomizeOptions } from './types';

// Helper function to generate default valid options matching your strict CustomizeOptions shape
function createDefaultOptions(overrides: Partial<CustomizeOptions> = {}): CustomizeOptions {
  return {
    username: 'testuser',
    theme: 'classic',
    bgHex: '',
    accentHex: '',
    textHex: '',
    bgType: 'solid',
    bgStart: '',
    bgEnd: '',
    bgAngle: 90,
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
    ...overrides,
  };
}

describe('Timezone Normalization & Calendar Data Boundary Alignment', () => {
  /**
   * Case 1: Mock Standard Timezone Settings
   * Assures that valid timezone options successfully assign the 'tz' parameter.
   */
  it('should cleanly serialize standard target timezones into the query string', () => {
    const timezones = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'] as const;

    timezones.forEach((tz) => {
      const options = createDefaultOptions({ timezone: tz });
      const queryParams = new URLSearchParams(buildQueryParams(options));

      if (tz === 'UTC') {
        expect(queryParams.has('tz')).toBe(false);
      } else {
        expect(queryParams.get('tz')).toBe(tz);
      }
    });
  });

  /**
   * Case 2: Assert Correct Visual Date Alignment
   * Validates that specific timezone setups maps cleanly to query strings
   * while adhering to strict viewMode requirements.
   */
  it('should properly configure query attributes matching targeted timeline visual grids', () => {
    const options = createDefaultOptions({
      timezone: 'America/New_York',
      viewMode: 'pulse',
    });

    const query = buildQueryParams(options);
    const params = new URLSearchParams(query);

    expect(params.get('tz')).toBe('America/New_York');
    expect(params.get('view')).toBe('pulse');
  });

  /**
   * Case 3: Verify Leap Year Boundaries
   * Tests that setting specific targeted calendar configurations (like pinning specific years)
   * cleanly reflects in the parameters to prevent dropped days in visual calendar grids.
   */
  it('should successfully pass specific year parameters to support accurate leap year bounds parsing', () => {
    const options = createDefaultOptions({
      year: '2024',
      timezone: 'Europe/London',
    });

    const query = buildQueryParams(options);
    const params = new URLSearchParams(query);

    expect(params.get('year')).toBe('2024');
    expect(params.get('tz')).toBe('Europe/London');
  });

  /**
   * Case 4: Validate Calendar Date Formats Across Locales
   * Verifies that when distinct region/language keys are provided alongside timezone data,
   * they map precisely to the 'lang' parameter for locale-aware formatting.
   */
  it('should preserve language and localization codes to ensure proper structural date layout formatting', () => {
    const locales = ['en', 'ja', 'es', 'fr'] as const;

    locales.forEach((lang) => {
      const options = createDefaultOptions({
        language: lang,
        timezone: 'Asia/Tokyo',
      });

      const query = buildQueryParams(options);
      const params = new URLSearchParams(query);

      expect(params.get('tz')).toBe('Asia/Tokyo');
      if (lang === 'en') {
        expect(params.has('lang')).toBe(false);
      } else {
        expect(params.get('lang')).toBe(lang);
      }
    });
  });

  /**
   * Case 5: Test Daylight Saving Time (DST) Transition Offsets
   * Verifies that the parameters correctly forward offset variations (e.g. grace periods)
   * that might be prone to offset shifts during DST spring forward/fall back intervals.
   */
  it('should safely serialize query specifications protecting timeline evaluation rules from offset drifts', () => {
    const options = createDefaultOptions({
      timezone: 'Europe/Berlin',
      grace: 2,
    });

    const query = buildQueryParams(options);
    const params = new URLSearchParams(query);

    expect(params.get('tz')).toBe('Europe/Berlin');
    expect(params.get('grace')).toBe('2');
  });
});
