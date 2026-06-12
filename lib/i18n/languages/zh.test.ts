import { describe, expect, it } from 'vitest';
import { getLabels, labels } from '../badgeLabels';

const requiredKeys = [
  'CURRENT_STREAK',
  'ANNUAL_SYNC_TOTAL',
  'PEAK_STREAK',
  'COMMITS_THIS_MONTH',
  'VS_LAST_MONTH',
] as const;

const expectedChineseLabels = {
  CURRENT_STREAK: '当前连续记录',
  ANNUAL_SYNC_TOTAL: '年度总计',
  PEAK_STREAK: '最长连续记录',
  COMMITS_THIS_MONTH: '本月提交次数',
  VS_LAST_MONTH: '较上个月',
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

describe('Chinese badge labels', () => {
  it('includes the zh language key in the labels dictionary', () => {
    expect(labels.zh).toBeDefined();
  });

  it('returns the exact Chinese translation mapping through getLabels', () => {
    expect(getLabels('zh')).toEqual(expectedChineseLabels);
  });

  it('returns the Chinese mapping when lang code casing differs', () => {
    expect(getLabels('ZH')).toEqual(expectedChineseLabels);
  });

  it('sets every required Chinese label to a non-empty string', () => {
    const chineseLabels = getLabels('zh');

    for (const key of requiredKeys) {
      expect(typeof chineseLabels[key]).toBe('string');
      expect(chineseLabels[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('renders a mock SVG with Chinese translated labels', () => {
    const svg = renderMockBadge('zh');

    expect(svg).toContain('data-lang="zh"');

    for (const value of Object.values(expectedChineseLabels)) {
      expect(svg).toContain(value);
    }
  });
});
