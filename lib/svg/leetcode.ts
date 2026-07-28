import type { LeetCodeStatData } from '../../services/leetcode/api';
import type { LeetCodeParams } from '../validations';
import { getNormalizedThemeKey, themes } from './themes';
import { escapeXML } from './sanitizer';
import { DEFAULT_FONTS_BASE64 } from './fonts';

export function getLeetCodeTheme(params: LeetCodeParams) {
  const themeKey = getNormalizedThemeKey(params.theme);
  const selectedTheme = themes[themeKey] || themes.dark;

  return {
    bg: params.bg || selectedTheme.bg,
    text: params.text || selectedTheme.text,
    accent: params.accent || selectedTheme.accent,
  };
}

export function generateLeetCodeSVG(stats: LeetCodeStatData, params: LeetCodeParams): string {
  const theme = getLeetCodeTheme(params);

  const bg = theme.bg.startsWith('#') ? theme.bg : `#${theme.bg}`;
  const text = theme.text.startsWith('#') ? theme.text : `#${theme.text}`;

  const width = params.width || 400;
  const height = params.height || 150;
  const radius = params.radius !== undefined ? params.radius : 8;

  let content = '';

  if (stats.error) {
    content = `
      <text x="${width / 2}" y="${height / 2}" class="title" text-anchor="middle" dominant-baseline="central">${escapeXML(stats.error)}</text>
    `;
  } else {
    const title = escapeXML(`${stats.username}'s LeetCode Stats`);

    // Calculate percentages
    const easyPercent = stats.totalSolved > 0 ? (stats.easySolved / stats.totalSolved) * 100 : 0;
    const mediumPercent =
      stats.totalSolved > 0 ? (stats.mediumSolved / stats.totalSolved) * 100 : 0;
    const hardPercent = stats.totalSolved > 0 ? (stats.hardSolved / stats.totalSolved) * 100 : 0;

    // Colors for difficulty
    const easyColor = '#00b8a3';
    const mediumColor = '#ffc01e';
    const hardColor = '#ff375f';

    let bars = '';
    if (stats.totalSolved > 0) {
      const totalBarWidth = width - 60;
      const easyWidth = (easyPercent / 100) * totalBarWidth;
      const mediumWidth = (mediumPercent / 100) * totalBarWidth;
      const hardWidth = (hardPercent / 100) * totalBarWidth;

      bars = `
        <rect x="30" y="120" width="${Math.max(0, easyWidth)}" height="8" rx="4" fill="${easyColor}" />
        <rect x="${30 + easyWidth}" y="120" width="${Math.max(0, mediumWidth)}" height="8" rx="0" fill="${mediumColor}" />
        <rect x="${30 + easyWidth + mediumWidth}" y="120" width="${Math.max(0, hardWidth)}" height="8" rx="4" fill="${hardColor}" />
      `;
    }

    content = `
      <text x="30" y="40" class="title">${title}</text>
      <text x="${width - 30}" y="40" class="title" text-anchor="end">Rank: ${stats.ranking.toLocaleString()}</text>
      
      <!-- Total Solved -->
      <text x="30" y="80" class="stat">Total Solved: ${stats.totalSolved}</text>
      
      <!-- Difficulty Breakdown -->
      <text x="30" y="105" class="stat" fill="${easyColor}">Easy: ${stats.easySolved}</text>
      <text x="${30 + (width - 60) / 2}" y="105" class="stat" fill="${mediumColor}" text-anchor="middle">Medium: ${stats.mediumSolved}</text>
      <text x="${width - 30}" y="105" class="stat" fill="${hardColor}" text-anchor="end">Hard: ${stats.hardSolved}</text>
      
      <!-- Progress Bar -->
      <rect x="30" y="120" width="${width - 60}" height="8" rx="4" fill="${text}" fill-opacity="0.1" />
      ${bars}
    `;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        ${DEFAULT_FONTS_BASE64}
        .title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 14px;
          fill: ${text};
        }
        .stat {
          font-family: 'Inter', 'Roboto', sans-serif;
          font-weight: 400;
          font-size: 12px;
          fill: ${text};
        }
      </style>
      <rect x="0.5" y="0.5" rx="${radius}" width="100%" height="100%" fill="${bg}" />
      ${content}
    </svg>
  `.trim();
}
