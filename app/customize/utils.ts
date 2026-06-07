import type { CustomizeOptions, ExportFormat } from './types';

const BADGE_BASE_URL = 'https://commitpulse.vercel.app/api/streak';

/**
 * Removes the leading # from a hex color string.
 * Used specifically for color picker handling in the customize interface.
 */
export function stripHash(val: string): string {
  return val.replace(/^#/, '');
}

/**
 * Validates if a string is a valid 6-digit hex color for the color picker.
 * Intentionally strict (6-digit only) for color customization.
 * Note: lib/svg/sanitizer.ts has a more flexible version supporting 3,4,6,8 digits for SVG theming.
 */
export function isValidHex(value: string): boolean {
  return /^[0-9a-fA-F]{6}$/.test(stripHash(value));
}

export function getBadgeUrl(queryString: string): string {
  return `${BADGE_BASE_URL}?${queryString}`;
}

/**
 * Maps a failed /api/streak preview response status to a user-facing message.
 * A 400 means invalid parameters (for example a bad color), not a missing user.
 */
export function streakErrorMessage(status: number): string {
  if (status === 404) return 'GitHub user not found';
  if (status === 400) return 'Invalid customization options';
  if (status === 429) return 'Rate limit exceeded. Please try again later.';
  return 'Failed to load badge';
}

export function getExportSnippet(format: ExportFormat, queryString: string): string {
  const badgeUrl = getBadgeUrl(queryString);

  // Extract username from query string for descriptive alt text
  const usernameMatch = queryString?.match(/(?:^|&)user=([^&]+)/);
  const username = usernameMatch ? usernameMatch[1] : null;
  const altText =
    queryString === undefined
      ? 'CommitPulse'
      : username
        ? `CommitPulse Contribution Graph for ${username}`
        : 'CommitPulse Contribution Graph';

  if (format === 'action') {
    return [
      'name: CommitPulse Streak Badge',
      '',
      'on:',
      '  push:',
      '    branches:',
      "      - '**'",
      '  schedule:',
      "    - cron: '0 0 * * *' # Runs daily at midnight",
      '  workflow_dispatch:',
      '',
      'jobs:',
      '  update-badge:',
      '    runs-on: ubuntu-latest',
      '    if: "!contains(github.event.head_commit.message, \'chore: update CommitPulse badge\')"',
      '    permissions:',
      '       contents: write',
      '    env:',
      '      FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - name: Fetch CommitPulse Badge',
      `        run: curl -o commitpulse.svg "${badgeUrl}"`,
      '      - name: Commit Badge',
      '        uses: stefanzweifel/git-auto-commit-action@v5',
      '        with:',
      '          commit_message: "chore: update CommitPulse badge"',
      '          file_pattern: commitpulse.svg',
    ].join('\n');
  }

  if (format === 'html') {
    return `<img src="${badgeUrl}" alt="${altText}" />`;
  }

  if (format === 'markdown') {
    return `![${altText}](${badgeUrl})`;
  }

  if (format === 'tsx') {
    return [
      "'use client';",
      '',
      "import React, { useState, useEffect } from 'react';",
      '',
      'interface CommitPulseProps extends React.HTMLAttributes<HTMLDivElement> {',
      '  username?: string;',
      '  theme?: string;',
      '  height?: string | number;',
      '  width?: string | number;',
      '}',
      '',
      'export function CommitPulse({',
      '  username,',
      '  theme,',
      '  height,',
      '  width,',
      '  className,',
      '  style,',
      '  ...props',
      '}: CommitPulseProps) {',
      "  const [svgContent, setSvgContent] = useState<string>('');",
      '  const [loading, setLoading] = useState<boolean>(true);',
      '  const [error, setError] = useState<string | null>(null);',
      '',
      '  useEffect(() => {',
      '    setLoading(true);',
      '    setError(null);',
      '',
      `    const params = new URLSearchParams("${queryString}");`,
      "    if (username) params.set('user', username);",
      '    if (theme) {',
      "      params.set('theme', theme);",
      "      params.delete('bg');",
      "      params.delete('accent');",
      "      params.delete('text');",
      '    }',
      "    if (width) params.set('width', width.toString());",
      "    if (height) params.set('height', height.toString());",
      '',
      `    const url = \`${BADGE_BASE_URL}?\${params.toString()}\`;`,
      '',
      '    const controller = new AbortController();',
      '    fetch(url, { signal: controller.signal })',
      '      .then((res) => {',
      '        if (!res.ok) {',
      '          throw new Error(\`Failed to load streak badge: \${res.statusText}\`);',
      '        }',
      '        return res.text();',
      '      })',
      '      .then((data) => {',
      '        setSvgContent(data);',
      '        setLoading(false);',
      '      })',
      '      .catch((err) => {',
      "        if (err.name !== 'AbortError') {",
      '          console.error(err);',
      "          setError(err.message || 'Failed to load badge');",
      '          setLoading(false);',
      '        }',
      '      });',
      '',
      '    return () => controller.abort();',
      '  }, [username, theme, width, height]);',
      '',
      '  return (',
      '    <div',
      '      className={className}',
      '      style={{',
      "        display: 'inline-block',",
      "        width: width || '100%',",
      "        height: height || 'auto',",
      "        minHeight: loading ? '100px' : undefined,",
      '        ...style,',
      '      }}',
      '      {...props}',
      '    >',
      '      {loading && (',
      '        <div',
      '          style={{',
      "            display: 'flex',",
      "            alignItems: 'center',",
      "            justifyContent: 'center',",
      "            height: '100%',",
      "            width: '100%',",
      '            opacity: 0.5,',
      "            fontFamily: 'monospace',",
      "            fontSize: '12px',",
      '          }}',
      '        >',
      '          Loading CommitPulse...',
      '        </div>',
      '      )}',
      '      {error && (',
      '        <div',
      '          style={{',
      "            display: 'flex',",
      "            alignItems: 'center',",
      "            justifyContent: 'center',",
      "            height: '100%',",
      "            width: '100%',",
      "            color: '#ef4444',",
      "            fontFamily: 'monospace',",
      "            fontSize: '12px',",
      '          }}',
      '        >',
      '          {error}',
      '        </div>',
      '      )}',
      '      {!loading && !error && svgContent && (',
      '        <div',
      "          style={{ width: '100%', height: '100%' }}",
      '          className="[&>svg]:w-full [&>svg]:h-auto"',
      '          dangerouslySetInnerHTML={{ __html: svgContent }}',
      '        />',
      '      )}',
      '    </div>',
      '  );',
      '}',
    ].join('\n');
  }

  throw new Error(`Unsupported export format: ${format}`);
}

export function getPlaceholderSnippet(format: ExportFormat): string {
  return getExportSnippet(format, 'user=your-github-username');
}

export function buildQueryParams(options: CustomizeOptions): string {
  const params = new URLSearchParams();

  const trimmedUsername = options.username.trim();
  const hasUsername = trimmedUsername.length > 0;

  if (hasUsername) {
    params.set('user', trimmedUsername);
  }

  const isAutoTheme = options.theme === 'auto';
  const isRandomTheme = options.theme === 'random';
  const skipsCustomColors = isAutoTheme || isRandomTheme;

  if (skipsCustomColors) {
    // Virtual themes always emit theme=<name> and skip custom color params.
    params.set('theme', options.theme);
  } else {
    const hasValidBg = isValidHex(options.bgHex);
    const hasValidAccent = isValidHex(options.accentHex);
    const hasValidText = isValidHex(options.textHex);
    const hasCustomColors = hasValidBg || hasValidAccent || hasValidText;

    // Only complete, valid hex colors take priority over theme; partial input falls back to theme.
    if (!hasCustomColors) {
      params.set('theme', options.theme);
    }
    if (hasValidBg) params.set('bg', stripHash(options.bgHex));
    if (hasValidAccent) params.set('accent', stripHash(options.accentHex));
    if (hasValidText) params.set('text', stripHash(options.textHex));
  }

  if (options.scale !== 'linear') params.set('scale', options.scale);
  if (options.speed !== '8s') params.set('speed', options.speed);
  if (options.font) params.set('font', options.font);
  if (options.year) params.set('year', options.year);
  if (options.radius !== 8) params.set('radius', options.radius.toString());
  if (options.size !== 'medium') params.set('size', options.size);

  if (options.hideTitle) params.set('hide_title', 'true');
  if (options.hideBackground) params.set('hide_background', 'true');
  if (options.hideStats) params.set('hide_stats', 'true');
  if (options.viewMode !== 'default') params.set('view', options.viewMode);
  if (options.deltaFormat !== 'percent') params.set('delta_format', options.deltaFormat);
  if (options.badgeWidth !== '') params.set('width', options.badgeWidth.toString());
  if (options.badgeHeight !== '') params.set('height', options.badgeHeight.toString());
  if (options.grace !== 1) params.set('grace', options.grace.toString());
  if (options.language !== 'en') params.set('lang', options.language);
  if (options.timezone !== 'UTC') params.set('tz', options.timezone);

  return params.toString();
}
