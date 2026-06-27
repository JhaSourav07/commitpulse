import { describe, expect, it } from 'vitest';
import { getLabels, labels } from '../badgeLabels';

const requiredKeys = [
  'CURRENT_STREAK',
  'ANNUAL_SYNC_TOTAL',
  'PEAK_STREAK',
  'COMMITS_THIS_MONTH',
  'VS_LAST_MONTH',
] as const;

const expectedJapaneseLabels = {
  CURRENT_STREAK: '現在のストリーク',
  ANNUAL_SYNC_TOTAL: '年間合計',
  PEAK_STREAK: '最高ストリーク',
  COMMITS_THIS_MONTH: '今月のコミット数',
  VS_LAST_MONTH: '先月比',
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

describe('Japanese badge labels', () => {
  it('includes the ja language key in the labels dictionary', () => {
    expect(labels.ja).toBeDefined();
  });

  it('returns the exact Japanese translation mapping through getLabels', () => {
    expect(getLabels('ja')).toEqual(expectedJapaneseLabels);
  });

  it('returns the Japanese mapping when lang code casing differs', () => {
    expect(getLabels('JA')).toEqual(expectedJapaneseLabels);
  });

  it('sets every required Japanese label to a non-empty string', () => {
    const japaneseLabels = getLabels('ja');

    for (const key of requiredKeys) {
      expect(typeof japaneseLabels[key]).toBe('string');
      expect(japaneseLabels[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('renders a mock SVG with Japanese translated labels', () => {
    const svg = renderMockBadge('ja');

    expect(svg).toContain('data-lang="ja"');

    for (const value of Object.values(expectedJapaneseLabels)) {
      expect(svg).toContain(value);
    }
  });
});
