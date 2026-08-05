import { describe, it, expect } from 'vitest';
import { processCommitTimestamps } from './dateHelpers';

describe('processCommitTimestamps', () => {
  it('classifies morning commits (6 AM - 12 PM)', () => {
    const result = processCommitTimestamps(['2024-03-10T09:30:00Z']);
    expect(result.morning).toBe(1);
    expect(result.afternoon).toBe(0);
    expect(result.evening).toBe(0);
    expect(result.night).toBe(0);
  });

  it('classifies afternoon commits (12 PM - 6 PM)', () => {
    const result = processCommitTimestamps(['2024-03-10T14:00:00Z']);
    expect(result.morning).toBe(0);
    expect(result.afternoon).toBe(1);
    expect(result.evening).toBe(0);
    expect(result.night).toBe(0);
  });

  it('classifies evening commits (6 PM - 12 AM)', () => {
    const result = processCommitTimestamps(['2024-03-10T20:00:00Z']);
    expect(result.morning).toBe(0);
    expect(result.afternoon).toBe(0);
    expect(result.evening).toBe(1);
    expect(result.night).toBe(0);
  });

  it('classifies night commits (12 AM - 6 AM)', () => {
    const result = processCommitTimestamps(['2024-03-10T03:00:00Z']);
    expect(result.morning).toBe(0);
    expect(result.afternoon).toBe(0);
    expect(result.evening).toBe(0);
    expect(result.night).toBe(1);
  });

  it('returns zeroed metrics for an empty array', () => {
    const result = processCommitTimestamps([]);
    expect(result).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
  });

  it('skips invalid date strings without crashing', () => {
    const result = processCommitTimestamps(['invalid-date', '2024-03-10T09:00:00Z']);
    expect(result.morning).toBe(1);
  });

  it('skips null and undefined entries', () => {
    const result = processCommitTimestamps([null as any, '2024-03-10T09:00:00Z', undefined as any]);
    expect(result.morning).toBe(1);
  });

  it('handles Date objects as input', () => {
    const date = new Date('2024-03-10T14:00:00Z');
    const result = processCommitTimestamps([date]);
    expect(result.afternoon).toBe(1);
  });
});
