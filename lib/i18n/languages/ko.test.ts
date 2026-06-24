import { describe, expect, it } from 'vitest';
import { getLabels, labels } from '../badgeLabels';

const requiredKeys = [
  'CURRENT_STREAK',
  'ANNUAL_SYNC_TOTAL',
  'PEAK_STREAK',
  'COMMITS_THIS_MONTH',
  'VS_LAST_MONTH',
] as const;

const expectedKoreanLabels = {
  CURRENT_STREAK: '현재 연속',
  ANNUAL_SYNC_TOTAL: '연간 총계',
  PEAK_STREAK: '최고 연속',
  COMMITS_THIS_MONTH: '이번 달 커밋',
  VS_LAST_MONTH: '지난달 대비',
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

describe('Korean badge labels', () => {
  it('includes the ko language key in the labels dictionary', () => {
    expect(labels.ko).toBeDefined();
  });

  it('returns the exact Korean translation mapping through getLabels', () => {
    expect(getLabels('ko')).toEqual(expectedKoreanLabels);
  });

  it('returns the Korean mapping when lang code casing differs', () => {
    expect(getLabels('KO')).toEqual(expectedKoreanLabels);
  });

  it('sets every required Korean label to a non-empty string', () => {
    const koreanLabels = getLabels('ko');

    for (const key of requiredKeys) {
      expect(typeof koreanLabels[key]).toBe('string');
      expect(koreanLabels[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('renders a mock SVG with Korean translated labels', () => {
    const svg = renderMockBadge('ko');

    expect(svg).toContain('data-lang="ko"');

    for (const value of Object.values(expectedKoreanLabels)) {
      expect(svg).toContain(value);
    }
  });
});
