import type { Article } from '../rss';
import { getSizeScale } from './generator';
import { escapeXML, sanitizeRadius } from './sanitizer';

const ARTICLES_SVG_WIDTH = 400;
const ARTICLES_SVG_HEIGHT = 160;

export function generateArticlesSVG(articles: Article[], params: Record<string, string>): string {
  const sf = getSizeScale(params.size as 'small' | 'medium' | 'large' | undefined);
  const bgColor = params.bg || '0d1117';
  const textColor = params.text || 'c9d1d9';
  const accentColor = params.accent || '58a6ff';
  const platform = params.platform === 'hashnode' ? 'Hashnode' : 'Dev.to';
  const username = params.user ? escapeXML(params.user) : 'User';

  const safeRadius = sanitizeRadius(params.radius, 8);

  let articlesListSVG = '';

  if (articles.length === 0) {
    articlesListSVG = `
      <text x="200" y="80" class="empty-text" text-anchor="middle">No articles found</text>
    `;
  } else {
    articles.forEach((article, index) => {
      const yPos = 55 + index * 35;
      // Truncate title if it's too long (rough estimate)
      let displayTitle = article.title;
      if (displayTitle.length > 45) {
        displayTitle = displayTitle.substring(0, 42) + '...';
      }

      const safeTitle = escapeXML(displayTitle);
      const safeDate = escapeXML(article.pubDate);

      articlesListSVG += `
      <g transform="translate(20, ${yPos})">
        <circle cx="6" cy="-4" r="4" fill="#${accentColor}" />
        <text x="20" y="0" class="article-title">${safeTitle}</text>
        <text x="360" y="0" class="article-date" text-anchor="end">${safeDate}</text>
      </g>
      `;
    });
  }

  return `<svg style="max-width: 100%; height: auto;" xmlns="http://www.w3.org/2000/svg" width="${Math.round(ARTICLES_SVG_WIDTH * sf)}" height="${Math.round(ARTICLES_SVG_HEIGHT * sf)}" viewBox="0 0 ${ARTICLES_SVG_WIDTH} ${ARTICLES_SVG_HEIGHT}" role="img" aria-labelledby="cp-articles-title cp-articles-desc">
  <title id="cp-articles-title">Latest Articles on ${platform} for ${username}</title>
  <desc id="cp-articles-desc">A list of the latest articles published by ${username} on ${platform}.</desc>
  <defs>
    <style>
      .header-title { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 16px; fill: #${textColor}; }
      .header-subtitle { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 12px; fill: #${textColor}; opacity: 0.6; }
      .article-title { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13px; fill: #${textColor}; }
      .article-date { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 11px; fill: #${textColor}; opacity: 0.7; }
      .empty-text { font-family: 'Inter', sans-serif; font-weight: 500; font-size: 14px; fill: #${textColor}; opacity: 0.5; }
    </style>
  </defs>

  <rect width="${ARTICLES_SVG_WIDTH}" height="${ARTICLES_SVG_HEIGHT}" fill="#${bgColor}" rx="${safeRadius}" />
  
  <g transform="translate(20, 25)">
    <text x="0" y="0" class="header-title">Latest Articles</text>
    <text x="360" y="0" class="header-subtitle" text-anchor="end">on ${platform}</text>
  </g>

  <line x1="20" y1="35" x2="380" y2="35" stroke="#${textColor}" stroke-opacity="0.1" stroke-width="1" />

  ${articlesListSVG}
</svg>`;
}
