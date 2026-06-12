import { afterEach, describe, expect, it } from 'vitest';
import { getMockTimezone, resetMockTimezone, setMockTimezone } from './timezone';

afterEach(() => {
  resetMockTimezone();
});

describe('timezone mock helper', () => {
  it('defaults DateTimeFormat without an explicit timezone to UTC', () => {
    const formatter = new Intl.DateTimeFormat('en-US');

    expect(formatter.resolvedOptions().timeZone).toBe('UTC');
    expect(getMockTimezone()).toBe('UTC');
  });

  it('lets tests switch the default timezone when needed', () => {
    setMockTimezone('Etc/GMT+8');

    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date('2024-06-16T07:00:00.000Z'));
    const mapped = Object.fromEntries(
      parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
    );

    expect(formatter.resolvedOptions().timeZone).toBe('Etc/GMT+8');
    expect(mapped).toMatchObject({
      year: '2024',
      month: '06',
      day: '15',
    });
  });

  it('keeps explicit timeZone options intact', () => {
    setMockTimezone('Etc/GMT+8');

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    expect(formatter.resolvedOptions().timeZone).toBe('America/New_York');
  });
});
