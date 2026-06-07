import { describe, expect, it } from 'vitest';
import { getLabels, labels } from '../badgeLabels';

const requiredKeys = [
  'CURRENT_STREAK',
  'ANNUAL_SYNC_TOTAL',
  'PEAK_STREAK',
  'COMMITS_THIS_MONTH',
  'VS_LAST_MONTH',
] as const;

const expectedGermanLabels = {
  CURRENT_STREAK: 'AKTUELLE_SERIE',
  ANNUAL_SYNC_TOTAL: 'JAHRES_GESAMT',
  PEAK_STREAK: 'SPITZEN_SERIE',
  COMMITS_THIS_MONTH: 'COMMITS DIESEN MONAT',
  VS_LAST_MONTH: 'im Vgl. zum Vormonat',
};

function renderMockBadge(lang: string) {
  const badgeLabels = getLabels(lang);

  return `
    <svg role="img" data-lang="${lang}">
      <text>${badgeLabels.CURRENT_STREAK}</text>
      <text>${badgeLabels.ANNUAL_SYNC_TOTAL}</text>
      <text>${badgeLabels.PEAK_STREAK}</text>
      <text>${badgeLabels.COMMITS_THIS_MONTH}</text>
      <text>${badgeLabels.VS_LAST_MONTH}</text>
    </svg>
  `;
}

describe('German badge labels', () => {
  it('includes the de language key in the labels dictionary', () => {
    expect(labels.de).toBeDefined();
  });

  it('returns the exact German translation mapping through getLabels', () => {
    expect(getLabels('de')).toEqual(expectedGermanLabels);
  });

  it('returns the German mapping when lang code casing differs', () => {
    expect(getLabels('DE')).toEqual(expectedGermanLabels);
  });

  it('sets every required German label to a non-empty string', () => {
    const germanLabels = getLabels('de');

    for (const key of requiredKeys) {
      expect(typeof germanLabels[key]).toBe('string');
      expect(germanLabels[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('renders a mock SVG with German translated labels', () => {
    const svg = renderMockBadge('de');

    expect(svg).toContain('data-lang="de"');

    for (const value of Object.values(expectedGermanLabels)) {
      expect(svg).toContain(value);
    }
  });
});
