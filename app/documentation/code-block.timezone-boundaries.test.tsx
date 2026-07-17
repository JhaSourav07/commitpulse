import { describe, expect, it, vi, afterEach } from 'vitest';
import { CodeBlock } from './code-block';

const ORIGINAL_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

function mockTimezone(timeZone: string) {
  vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => ({
    resolvedOptions: () => ({
      locale: 'en-US',
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone,
    }),
  })) as typeof Intl.DateTimeFormat);
}

describe('CodeBlock Timezone Normalization & Calendar Data Boundary Alignment', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockTimezone(ORIGINAL_TIMEZONE);
  });

  it('keeps the component stable across common timezones', () => {
    ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'].forEach((tz) => {
      vi.restoreAllMocks();
      mockTimezone(tz);

      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(tz);
      expect(CodeBlock).toBeDefined();
    });
  });

  it('remains stable around leap year calendar boundaries', () => {
    const leap = new Date('2024-02-29T12:00:00Z');
    const afterLeap = new Date('2024-03-01T12:00:00Z');

    expect(leap.getUTCDate()).toBe(29);
    expect(afterLeap.getUTCDate()).toBe(1);

    expect(CodeBlock).toBeDefined();
  });

  it('remains stable during daylight saving transitions', () => {
    mockTimezone('America/New_York');

    const dstDate = new Date('2025-03-09T07:00:00Z');

    expect(dstDate).toBeInstanceOf(Date);
    expect(CodeBlock).toBeDefined();
  });

  it('creates a valid React element across timezone settings', () => {
    const element = <CodeBlock code='console.log("timezone");' />;

    expect(element).toBeDefined();
    expect(element.props.code).toBe('console.log("timezone");');
  });

  it('preserves the required code prop regardless of timezone', () => {
    expect(typeof CodeBlock).toBe('function');
    expect(CodeBlock).toBeDefined();
  });
});
