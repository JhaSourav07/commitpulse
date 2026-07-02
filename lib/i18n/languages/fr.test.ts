import { describe, expect, it } from 'vitest';
import { getLabels, labels } from '../badgeLabels';

const requiredKeys = [
  'CURRENT_STREAK',
  'ANNUAL_SYNC_TOTAL',
  'PEAK_STREAK',
  'COMMITS_THIS_MONTH',
  'VS_LAST_MONTH',
] as const;

const expectedFrenchLabels = {
  CURRENT_STREAK: 'Série Actuelle',
  ANNUAL_SYNC_TOTAL: 'Total Annuel',
  PEAK_STREAK: 'Série Maximale',
  COMMITS_THIS_MONTH: 'Commits Ce Mois',
  VS_LAST_MONTH: 'vs mois dernier',
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

describe('French badge labels', () => {
  it('includes the fr language key in the labels dictionary', () => {
    expect(labels.fr).toBeDefined();
  });

  it('returns the exact French translation mapping through getLabels', () => {
    expect(getLabels('fr')).toEqual(expectedFrenchLabels);
  });

  it('returns the French mapping when lang code casing differs', () => {
    expect(getLabels('FR')).toEqual(expectedFrenchLabels);
  });

  it('sets every required French label to a non-empty string', () => {
    const frenchLabels = getLabels('fr');

    for (const key of requiredKeys) {
      expect(typeof frenchLabels[key]).toBe('string');
      expect(frenchLabels[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('renders a mock SVG with French translated labels', () => {
    const svg = renderMockBadge('fr');

    expect(svg).toContain('data-lang="fr"');

    for (const value of Object.values(expectedFrenchLabels)) {
      expect(svg).toContain(value);
    }
  });
});
