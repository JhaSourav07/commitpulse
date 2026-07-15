import { GitHubRepo } from '@/lib/github';
import { LANGUAGE_COLORS } from './languageColors';
import { escapeXML } from './sanitizer';
import { BadgeParams } from '@/types';

function buildSparkline(data: number[], width: number, height: number, color: string): string {
  if (!data || data.length === 0) return '';
  const max = Math.max(...data, 1);
  const step = width / (data.length - 1 || 1);

  const points = data.map((val, i) => {
    const x = i * step;
    const y = height - (val / max) * height;
    return `${x},${y}`;
  });

  // Adding a fill area below the line for a glow/gradient effect
  const fillPoints = `0,${height} ${points.join(' ')} ${width},${height}`;

  return `
    <defs>
      <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polyline points="${fillPoints}" fill="url(#sparkline-grad)"/>
    <polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

export function generateRepoSpotlightSVG(repo: GitHubRepo, params: BadgeParams): string {
  const bg = Array.isArray(params.bg) ? params.bg[0] : params.bg;
  const text = Array.isArray(params.text) ? params.text[0] : params.text;
  const accent = Array.isArray(params.accent)
    ? params.accent[params.accent.length - 1]
    : params.accent;
  const radius = params.radius;

  const width = 450;
  const height = 160;
  const padding = 20;

  const repoName = escapeXML(repo.name);
  const description = escapeXML(repo.description || '');
  const lang = escapeXML(repo.language || 'Unknown');
  const langColor =
    repo.language && LANGUAGE_COLORS[repo.language] ? LANGUAGE_COLORS[repo.language] : '#858585';

  const stars =
    repo.stargazers_count > 999
      ? (repo.stargazers_count / 1000).toFixed(1) + 'k'
      : repo.stargazers_count;
  const forks =
    repo.forks_count && repo.forks_count > 999
      ? (repo.forks_count / 1000).toFixed(1) + 'k'
      : repo.forks_count || 0;

  // Parse dates if available
  const dateStr = repo.pushed_at
    ? new Date(repo.pushed_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';
  const updateText = dateStr ? `Updated ${dateStr}` : '';

  // Calculate wrapped description lines
  const descLines: string[] = [];
  const words = description.split(' ');
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + ' ' + word).length > 55) {
      if (descLines.length === 2) {
        descLines[1] += '...';
        currentLine = '';
        break;
      }
      descLines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine ? ' ' : '') + word;
    }
  }
  if (currentLine && descLines.length < 2) {
    descLines.push(currentLine.trim());
  }

  const sparklineWidth = 140;
  const sparklineHeight = 40;
  const sparkline = buildSparkline(
    repo.participation || [],
    sparklineWidth,
    sparklineHeight,
    accent
  );

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title">
      <title id="title">Repository Spotlight: ${repoName}</title>
      <rect width="${width}" height="${height}" rx="${radius}" fill="#${bg}" stroke="#${accent}" stroke-width="1" stroke-opacity="0.3"/>
      
      <g transform="translate(${padding}, ${padding})">
        <!-- Repo Icon -->
        <svg x="0" y="2" width="16" height="16" viewBox="0 0 16 16" fill="#${text}" opacity="0.7">
          <path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
        </svg>
        
        <!-- Repo Name -->
        <text x="24" y="14" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'" font-size="16" font-weight="600" fill="#${accent}">
          ${repoName}
        </text>

        <!-- Description -->
        <g transform="translate(0, 38)">
          ${descLines.map((line, i) => `<text x="0" y="${i * 18}" font-family="sans-serif" font-size="12" fill="#${text}" opacity="0.8">${escapeXML(line)}</text>`).join('')}
        </g>
        
        <!-- Bottom Stats Row -->
        <g transform="translate(0, 102)">
          <!-- Language -->
          <circle cx="6" cy="-4" r="6" fill="${langColor}"/>
          <text x="16" y="0" font-family="sans-serif" font-size="12" fill="#${text}" opacity="0.8">${lang}</text>
          
          <!-- Stars -->
          <svg x="90" y="-13" width="16" height="16" viewBox="0 0 16 16" fill="#${text}" opacity="0.6">
            <path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
          </svg>
          <text x="108" y="0" font-family="sans-serif" font-size="12" fill="#${text}" opacity="0.8">${stars}</text>
          
          <!-- Forks -->
          <svg x="150" y="-13" width="16" height="16" viewBox="0 0 16 16" fill="#${text}" opacity="0.6">
            <path fill-rule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
          </svg>
          <text x="168" y="0" font-family="sans-serif" font-size="12" fill="#${text}" opacity="0.8">${forks}</text>
          
          <!-- Updated At -->
          ${updateText ? `<text x="220" y="0" font-family="sans-serif" font-size="12" fill="#${text}" opacity="0.5">${escapeXML(updateText)}</text>` : ''}
        </g>
        
        <!-- Activity Graph -->
        <g transform="translate(${width - sparklineWidth - padding * 2}, 60)">
          ${sparkline}
        </g>
      </g>
    </svg>
  `;
}
