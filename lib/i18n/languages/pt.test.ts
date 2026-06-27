import { describe, expect, it } from 'vitest';
import { getLabels, labels } from '../badgeLabels';

const requiredKeys = [
  'CURRENT_STREAK',
  'ANNUAL_SYNC_TOTAL',
  'PEAK_STREAK',
  'COMMITS_THIS_MONTH',
  'VS_LAST_MONTH',
] as const;

const expectedPortugueseLabels = {
  CURRENT_STREAK: 'Série Atual',
  ANNUAL_SYNC_TOTAL: 'Total Anual',
  PEAK_STREAK: 'Série Máxima',
  COMMITS_THIS_MONTH: 'Commits Este Mês',
  VS_LAST_MONTH: 'vs mês passado',
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

describe('Portuguese badge labels', () => {
  it('includes the pt language key in the labels dictionary', () => {
    expect(labels.pt).toBeDefined();
  });

  it('returns the exact Portuguese translation mapping through getLabels', () => {
    expect(getLabels('pt')).toEqual(expectedPortugueseLabels);
  });

  it('returns the Portuguese mapping when lang code casing differs', () => {
    expect(getLabels('PT')).toEqual(expectedPortugueseLabels);
  });

  it('sets every required Portuguese label to a non-empty string', () => {
    const portugueseLabels = getLabels('pt');

    for (const key of requiredKeys) {
      expect(typeof portugueseLabels[key]).toBe('string');
      expect(portugueseLabels[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('renders a mock SVG with Portuguese translated labels', () => {
    const svg = renderMockBadge('pt');

    expect(svg).toContain('data-lang="pt"');

    for (const value of Object.values(expectedPortugueseLabels)) {
      expect(svg).toContain(value);
    }
  });
});
