import { describe, expect, it } from 'vitest';
import { getLabels, labels } from '../badgeLabels';

const requiredKeys = [
  'CURRENT_STREAK',
  'ANNUAL_SYNC_TOTAL',
  'PEAK_STREAK',
  'COMMITS_THIS_MONTH',
  'VS_LAST_MONTH',
] as const;

const expectedHindiLabels = {
  CURRENT_STREAK: 'वर्तमान स्ट्रीक',
  ANNUAL_SYNC_TOTAL: 'वार्षिक कुल',
  PEAK_STREAK: 'अधिकतम स्ट्रीक',
  COMMITS_THIS_MONTH: 'इस महीने के कमिट्स',
  VS_LAST_MONTH: 'पिछले महीने की तुलना में',
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

describe('Hindi badge labels', () => {
  it('includes the hi language key in the labels dictionary', () => {
    expect(labels.hi).toBeDefined();
  });

  it('returns the exact Hindi translation mapping through getLabels', () => {
    expect(getLabels('hi')).toEqual(expectedHindiLabels);
  });

  it('returns the Hindi mapping when lang code casing differs', () => {
    expect(getLabels('HI')).toEqual(expectedHindiLabels);
  });

  it('sets every required Hindi label to a non-empty string', () => {
    const hindiLabels = getLabels('hi');

    for (const key of requiredKeys) {
      expect(typeof hindiLabels[key]).toBe('string');
      expect(hindiLabels[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('renders a mock SVG with Hindi translated labels', () => {
    const svg = renderMockBadge('hi');

    expect(svg).toContain('data-lang="hi"');

    for (const value of Object.values(expectedHindiLabels)) {
      expect(svg).toContain(value);
    }
  });
});
