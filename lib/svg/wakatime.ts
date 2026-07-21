import type { WakaTimeStatData } from '../../services/wakatime/api';
import type { WakatimeParams } from '../validations';
import { getNormalizedThemeKey, themes } from './themes';
import { escapeXML } from './sanitizer';
import { DEFAULT_FONTS_BASE64 } from './fonts';

export function getWakaTimeTheme(params: WakatimeParams) {
  const themeKey = getNormalizedThemeKey(params.theme);
  const selectedTheme = themes[themeKey] || themes.dark;

  return {
    bg: params.bg || selectedTheme.bg,
    text: params.text || selectedTheme.text,
    accent: params.accent || selectedTheme.accent,
  };
}

export function generateWakaTimeSVG(stats: WakaTimeStatData, params: WakatimeParams): string {
  const theme = getWakaTimeTheme(params);

  const bg = theme.bg.startsWith('#') ? theme.bg : `#${theme.bg}`;
  const text = theme.text.startsWith('#') ? theme.text : `#${theme.text}`;
  const accent = Array.isArray(theme.accent) ? theme.accent[0] : theme.accent;
  const accentHex = accent.startsWith('#') ? accent : `#${accent}`;

  const width = params.width || 400;
  const height = params.height || 150;
  const radius = params.radius !== undefined ? params.radius : 8;

  let content = '';

  if (!stats.isConfigured) {
    content = `
      <text x="${width / 2}" y="${height / 2}" class="title" text-anchor="middle" dominant-baseline="central">WakaTime Not Configured</text>
    `;
  } else if (stats.totalSeconds === undefined) {
    content = `
      <text x="${width / 2}" y="${height / 2}" class="title" text-anchor="middle" dominant-baseline="central">No Data Available</text>
    `;
  } else {
    const totalTime = escapeXML(stats.humanReadableTotal || '0 hrs');
    const languages = stats.languages || [];

    let langBars = '';
    let langLegend = '';
    let currentX = 30;

    // Top 5 languages
    languages.forEach((lang, i) => {
      const barWidth = Math.max(1, ((width - 60) * lang.percent) / 100);

      // Alternate opacities for different languages to distinguish them
      const opacity = 1 - i * 0.15;

      langBars += `
        <rect x="${currentX}" y="65" width="${barWidth}" height="8" fill="${accentHex}" fill-opacity="${opacity}" />
      `;

      // Two column legend
      const col = i % 2;
      const row = Math.floor(i / 2);
      const legendX = 30 + (col * (width - 60)) / 2;
      const legendY = 95 + row * 20;

      langLegend += `
        <circle cx="${legendX + 4}" cy="${legendY - 4}" r="4" fill="${accentHex}" fill-opacity="${opacity}" />
        <text x="${legendX + 15}" y="${legendY}" class="stat">${escapeXML(lang.name)} - ${lang.percent}%</text>
      `;

      currentX += barWidth;
    });

    content = `
      <text x="30" y="40" class="title">WakaTime Stats (Last 7 Days)</text>
      <text x="${width - 30}" y="40" class="title" text-anchor="end">${totalTime}</text>
      ${langBars}
      ${langLegend}
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
          opacity: 0.8;
        }
      </style>
      <rect x="0.5" y="0.5" rx="${radius}" width="100%" height="100%" fill="${bg}" />
      ${content}
    </svg>
  `.trim();
}
