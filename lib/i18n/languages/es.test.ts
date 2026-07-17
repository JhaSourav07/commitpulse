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

    expect(es.CURRENT_STREAK).toBe('RACHA_ACTUAL');
    expect(es.ANNUAL_SYNC_TOTAL).toBe('TOTAL_ANUAL');
    expect(es.PEAK_STREAK).toBe('RACHA_MÁXIMA');
    expect(es.COMMITS_THIS_MONTH).toBe('COMMITS ESTE MES');
    expect(es.VS_LAST_MONTH).toBe('vs mes anterior');
  });
});