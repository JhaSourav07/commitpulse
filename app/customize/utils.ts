import type { ExportFormat } from './types';

const BADGE_BASE_URL = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://commitpulse.vercel.app'}/api/streak`;

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

export function getExportSnippet(format: ExportFormat, queryString: string): string {
  const badgeUrl = getBadgeUrl(queryString);

  if (format === 'html') {
    return `<img src="${badgeUrl}" alt="CommitPulse" />`;
  }

  if (format === 'action') {
    return [
      'name: CommitPulse Streak Badge',
      '',
      'on:',
      '  schedule:',
      "    - cron: '0 0 * * *' # Runs daily at midnight",
      '  workflow_dispatch:',
      '',
      'jobs:',
      '  update-badge:',
      '    runs-on: ubuntu-latest',
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

  if (format === 'markdown') {
    return `![CommitPulse](${badgeUrl})`;
  }

  // Defensive fallback for any unexpected formats (though TS should catch this)
  throw new Error(`Unsupported export format: ${format}`);
}

export function getPlaceholderSnippet(format: ExportFormat): string {
  return getExportSnippet(format, 'user=your-github-username');
}
