// app/customize/utils.accessibility.test.ts

import { describe, expect, it } from 'vitest';
import {
  buildQueryParams,
  getExportSnippet,
  getPlaceholderSnippet,
  streakErrorMessage,
} from './utils';
import type { CustomizeOptions } from './types';

describe('Customize Utils Accessibility', () => {
  it('produces HTML snippets with a non-empty alt attribute so screen readers can announce the badge', () => {
    // WCAG 1.1.1 (Non-text Content) — every <img> must have meaningful alt text.
    const formats: Array<'html'> = ['html'];

    formats.forEach((format) => {
      const snippet = getExportSnippet(format, 'user=alice&theme=dark');
      const altMatch = snippet.match(/alt="([^"]*)"/);

      expect(altMatch).not.toBeNull();
      expect(altMatch?.[1]?.trim().length).toBeGreaterThan(0);
      expect(altMatch?.[1]).toContain('CommitPulse');
    });
  });

  it('includes the username in alt text so assistive tech identifies whose contribution graph is shown', () => {
    // WCAG 1.1.1 — alt text must be descriptive, not generic, when context is available.
    const username = 'octocat';
    const htmlSnippet = getExportSnippet('html', `user=${username}`);
    const markdownSnippet = getExportSnippet('markdown', `user=${username}`);

    expect(htmlSnippet).toContain(`alt="CommitPulse Contribution Graph for ${username}"`);
    expect(markdownSnippet).toContain(`![CommitPulse Contribution Graph for ${username}]`);
  });

  it('exposes user-facing error messages that are plain readable text for screen-reader announcement', () => {
    // WCAG 3.3.1 (Error Identification) — errors must be communicated in text, not codes.
    const statusCodes = [400, 404, 429, 500];

    statusCodes.forEach((status) => {
      const message = streakErrorMessage(status);
      expect(typeof message).toBe('string');
      expect(message.trim().length).toBeGreaterThan(0);
      // Must not leak raw status codes or technical jargon to end users
      expect(message).not.toMatch(/^\d+$/);
      expect(message).not.toContain('undefined');
      expect(message).not.toContain('null');
    });
  });

  it('embeds accessible loading and error fallback text in the TSX snippet for users on slow connections', () => {
    // WCAG 4.1.3 (Status Messages) — loading and error states must be communicated to assistive tech.
    const tsxSnippet = getExportSnippet('tsx', 'user=alice');

    // Loading state must announce a meaningful message
    expect(tsxSnippet).toContain('Loading CommitPulse...');

    // Error state must render the error text in the DOM (not just throw)
    expect(tsxSnippet).toContain('{error}');

    // SVG content must be inserted into a container that preserves rendering
    expect(tsxSnippet).toContain('dangerouslySetInnerHTML');
  });

  it('produces well-formed query strings without injecting characters that would break SVG/HTML markup', () => {
    // WCAG 4.1.1 (Parsing) — generated output must be valid markup so assistive tech can parse it.
    const defaultOptions: CustomizeOptions = {
      username: 'safe-user',
      theme: 'dark',
      bgHex: '',
      bgType: 'solid',
      bgStart: '',
      bgEnd: '',
      bgAngle: 90,
      accentHex: '',
      textHex: '',
      scale: 'linear',
      speed: '8s',
      font: 'Inter',
      year: '',
      radius: 8,
      size: 'medium',
      hideTitle: false,
      hideBackground: false,
      hideStats: false,
      viewMode: 'default',
      deltaFormat: 'percent',
      badgeWidth: '',
      badgeHeight: '',
      grace: 1,
      language: 'en',
      timezone: 'UTC',
    };

    const query = buildQueryParams(defaultOptions);

    // No raw HTML/SVG breaking characters should leak into the URL
    expect(query).not.toMatch(/[<>"']/);
    // Must be a parseable URLSearchParams string
    expect(() => new URLSearchParams(query)).not.toThrow();

    // Placeholder snippet must also be safe for embedding in README files
    const placeholderMarkdown = getPlaceholderSnippet('markdown');
    expect(placeholderMarkdown).toContain('your-github-username');
    expect(placeholderMarkdown).not.toMatch(/<script/i);
  });
});
