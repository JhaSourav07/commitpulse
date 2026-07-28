import type { LanguageData } from '@/types/dashboard';
import { getNormalizedThemeKey, themes } from './themes';
import { escapeXML, sanitizeRadius } from './sanitizer';
import { DEFAULT_FONTS_BASE64 } from './fonts';

export interface LanguagesCardParams {
  user?: string;
  theme?: string;
  bg?: string;
  text?: string;
  accent?: string | string[];
  title?: string;
  hide_title?: boolean;
  hide_border?: boolean;
  radius?: number;
  width?: number;
  height?: number;
  count?: number;
}

export function generateLanguagesSVG(
  languages: LanguageData[],
  params: LanguagesCardParams = {}
): string {
  const themeKey = getNormalizedThemeKey(params.theme);
  const selectedTheme = themes[themeKey] || themes.dark;

  const bg = params.bg
    ? params.bg.startsWith('#')
      ? params.bg
      : `#${params.bg}`
    : selectedTheme.bg.startsWith('#')
      ? selectedTheme.bg
      : `#${selectedTheme.bg}`;
  const text = params.text
    ? params.text.startsWith('#')
      ? params.text
      : `#${params.text}`
    : selectedTheme.text.startsWith('#')
      ? selectedTheme.text
      : `#${selectedTheme.text}`;

  const accentVal = Array.isArray(params.accent) ? params.accent[0] : params.accent;
  const accentHex = accentVal
    ? accentVal.startsWith('#')
      ? accentVal
      : `#${accentVal}`
    : selectedTheme.accent
      ? Array.isArray(selectedTheme.accent)
        ? `#${selectedTheme.accent[0]}`
        : selectedTheme.accent.startsWith('#')
          ? selectedTheme.accent
          : `#${selectedTheme.accent}`
      : '#3b82f6';

  const width = params.width || 400;
  const height = params.height || 210;
  const radius = sanitizeRadius(params.radius, 10);
  const user = escapeXML(params.user || '');
  const displayLanguages = (languages || []).slice(0, params.count || 5);
  const hideTitle = Boolean(params.hide_title);
  const hideBorder = Boolean(params.hide_border);

  const titleText = escapeXML(
    params.title || (user ? `${user}'s Top Languages` : 'Most Used Languages')
  );

  let content = '';

  if (!displayLanguages || displayLanguages.length === 0) {
    content = `
      <text x="${width / 2}" y="${height / 2}" class="no-data" text-anchor="middle" dominant-baseline="central">No Language Data Available</text>
    `;
  } else {
    // Distribution Bar
    const barX = 24;
    const barY = hideTitle ? 32 : 64;
    const barWidth = width - 48;
    const barHeight = 12;

    let currentBarX = barX;
    let barRects = '';

    displayLanguages.forEach((lang, i) => {
      const segmentWidth = (barWidth * lang.percentage) / 100;
      if (segmentWidth > 0) {
        const isFirst = i === 0;
        const rx = isFirst ? 4 : 0;
        const ry = isFirst ? 4 : 0;

        barRects += `
          <rect x="${currentBarX.toFixed(2)}" y="${barY}" width="${segmentWidth.toFixed(2)}" height="${barHeight}" fill="${lang.color}" rx="${rx}" ry="${ry}" />
        `;
        currentBarX += segmentWidth;
      }
    });

    // Legend Grid
    const legendStartY = barY + barHeight + 24;
    let legendItems = '';

    displayLanguages.forEach((lang, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const itemX = 24 + col * ((width - 48) / 2);
      const itemY = legendStartY + row * 24;

      const langName = escapeXML(lang.name);
      const percentStr = `${lang.percentage}%`;

      legendItems += `
        <g transform="translate(${itemX}, ${itemY})">
          <circle cx="5" cy="5" r="4.5" fill="${lang.color}" />
          <text x="16" y="9" class="lang-name">${langName}</text>
          <text x="${((width - 48) / 2 - 16).toFixed(2)}" y="9" class="lang-percent" text-anchor="end">${percentStr}</text>
        </g>
      `;
    });

    content = `
      ${
        !hideTitle
          ? `
        <g transform="translate(24, 34)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${accentHex}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          <text x="26" y="14" class="card-title">${titleText}</text>
        </g>
      `
          : ''
      }

      <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="#ffffff" fill-opacity="0.08" rx="4" />
      
      <g id="distribution-bar">
        ${barRects}
      </g>

      <g id="language-legend">
        ${legendItems}
      </g>
    `;
  }

  const borderStroke = hideBorder ? '' : 'stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"';

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${
      user ? `${user}'s language distribution` : 'Language distribution'
    }">
      <style>
        ${DEFAULT_FONTS_BASE64}
        .card-title {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 700;
          font-size: 15px;
          fill: ${text};
        }
        .lang-name {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 500;
          font-size: 12px;
          fill: ${text};
          fill-opacity: 0.9;
        }
        .lang-percent {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-weight: 600;
          font-size: 11px;
          fill: ${text};
          fill-opacity: 0.7;
        }
        .no-data {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 400;
          font-size: 13px;
          fill: ${text};
          fill-opacity: 0.6;
        }
      </style>
      <rect width="${width}" height="${height}" rx="${radius}" fill="${bg}" ${borderStroke} />
      ${content}
    </svg>
  `.trim();
}
