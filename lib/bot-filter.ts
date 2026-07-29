/**
 * Bot and automated-account filtering for contribution data.
 *
 * Filters out automated bots and dependency systems from GitHub contribution
 * counts and author lists so that human activity metrics are not skewed by
 * CI pipelines, dependency bots, or other automated systems.
 *
 * Detection is performed in two layers:
 * 1. **Custom allowlist** — authors listed in `.commitpulse.json` under the
 *    `ignored_authors` key are always excluded (allows fine-grained control).
 * 2. **Automated bot heuristics** — a set of pattern matches catches the
 *    most common automated accounts without configuration.
 *
 * Supported detection patterns:
 * - `[bot]` suffix (e.g. `dependabot[bot]`, `renovate[bot]`)
 * - `-bot` suffix (e.g. `codecov-bot`)
 * - Explicit known bot names: `dependabot`, `renovate`
 * - Custom entries from `.commitpulse.json`'s `ignored_authors` list
 *
 * @note
 * This module uses `fs` and `path` and is therefore server-side only.
 * It should not be imported in client components.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Reads and returns the list of ignored authors configured in the
 * `.commitpulse.json` file at the project root.
 *
 * The file is read synchronously on each call. For high-frequency usage,
 * consider caching the result at the call site.
 *
 * @returns A lowercase array of author strings from `ignored_authors`.
 *   Returns an empty array if the file does not exist, cannot be parsed,
 *   or the `ignored_authors` key is missing or not an array.
 */
export function getIgnoredAuthors(): string[] {
  try {
    const configPath = path.join(process.cwd(), '.commitpulse.json');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      if (config && Array.isArray(config.ignored_authors)) {
        return config.ignored_authors.map((author: string) => author.toLowerCase());
      }
    }
  } catch {
    // Ignore error and fallback to empty array
  }
  return [];
}

/**
 * Checks if the given username represents an automated bot or dependency system.
 *
 * Detection order:
 * 1. **Custom allowlist** — if the lowercase username appears in
 *    `ignored_authors` from `.commitpulse.json`, returns `true`.
 * 2. **`[bot]` suffix** — GitHub's standard bot naming convention
 *    (e.g. `dependabot[bot]`, `renovate[bot]`).
 * 3. **`-bot` suffix** — a common alternative bot naming convention.
 * 4. **Explicit known bot names** — `dependabot` and `renovate` are
 *    matched case-insensitively.
 *
 * An empty or falsy `username` always returns `false`.
 *
 * @param username - The GitHub username or author string to check.
 * @returns `true` if the username is identified as a bot; `false` otherwise.
 *
 * @example
 * isBotAuthor('dependabot[bot]');  // → true  (GitHub suffix)
 * isBotAuthor('codecov-bot');       // → true  (-bot suffix)
 * isBotAuthor('renovate');          // → true  (known bot name)
 * isBotAuthor('sponsor-bot');       // → true  (-bot suffix)
 * isBotAuthor('octocat');           // → false (human username)
 */
export function isBotAuthor(username: string): boolean {
  if (!username) return false;
  const lowerUsername = username.toLowerCase();

  // 1. Check custom configuration file
  const ignored = getIgnoredAuthors();
  if (ignored.includes(lowerUsername)) {
    return true;
  }

  // 2. Automatic regex detection for common bot naming conventions
  // e.g. dependabot[bot], renovate[bot]
  if (/\[bot\]$/i.test(username)) {
    return true;
  }

  // 3. Usernames ending with -bot or explicitly matching default bot names
  if (
    lowerUsername.endsWith('-bot') ||
    lowerUsername === 'dependabot' ||
    lowerUsername === 'renovate'
  ) {
    return true;
  }

  return false;
}
