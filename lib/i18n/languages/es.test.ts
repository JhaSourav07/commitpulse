import { describe, it, expect } from 'vitest';
import { labels, getLabels } from '../badgeLabels';

describe('Spanish language translations', () => {
  it('contains the es language key', () => {
    expect(labels).toHaveProperty('es');
  });

  it('returns the correct translation object from getLabels', () => {
    expect(getLabels('es')).toEqual(labels.es);
  });

  it('contains all required translation properties', () => {
    const es = labels.es;

    expect(es.CURRENT_STREAK).toBeTruthy();
    expect(es.ANNUAL_SYNC_TOTAL).toBeTruthy();
    expect(es.PEAK_STREAK).toBeTruthy();
    expect(es.COMMITS_THIS_MONTH).toBeTruthy();
    expect(es.VS_LAST_MONTH).toBeTruthy();
  });

  it('matches the expected Spanish translations', () => {
    const es = labels.es;

    expect(es.CURRENT_STREAK).toBe('Racha Actual');
    expect(es.ANNUAL_SYNC_TOTAL).toBe('Total Anual');
    expect(es.PEAK_STREAK).toBe('Racha Máxima');
    expect(es.COMMITS_THIS_MONTH).toBe('Commits Este Mes');
    expect(es.VS_LAST_MONTH).toBe('vs mes anterior');
  });

  it('is case-insensitively resolved by getLabels', () => {
    expect(getLabels('ES')).toEqual(labels.es);
    expect(getLabels('Es')).toEqual(labels.es);
  });
});
