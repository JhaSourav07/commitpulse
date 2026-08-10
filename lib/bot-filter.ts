import { existsSync, readFileSync } from 'node:fs';

const CONFIG_PATH = './commitpulse.config.json';

let cachedIgnoredAuthors: string[] | null = null;

/**
 * Resets the cached ignored authors.
 * Exported for test environments to clear module state between mock setups.
 */
export function _resetBotFilterCache(): void {
  cachedIgnoredAuthors = null;
}

/**
 * Retrieves the list of ignored authors, reading from config lazily on demand.
 */
export function getIgnoredAuthors(): string[] {
  if (cachedIgnoredAuthors === null) {
    try {
      if (existsSync(CONFIG_PATH)) {
        const fileContent = readFileSync(CONFIG_PATH, 'utf-8');
        const config = JSON.parse(fileContent);

        if (Array.isArray(config.ignored_authors)) {
          cachedIgnoredAuthors = config.ignored_authors
            .map((author: string) => (typeof author === 'string' ? author.toLowerCase() : ''))
            .filter(Boolean);
        } else {
          cachedIgnoredAuthors = [];
        }
      } else {
        cachedIgnoredAuthors = [];
      }
    } catch {
      cachedIgnoredAuthors = [];
    }
  }

  // Fallback ensures TypeScript receives `string[]` even if null checks are strict
  return cachedIgnoredAuthors ?? [];
}

/**
 * Checks if a given username belongs to a known bot or an ignored author.
 */
export function isBotAuthor(author: string | null | undefined): boolean {
  if (!author) return false;

  const normalized = author.toLowerCase();

  // 1. Default bot patterns
  const defaultBots = ['dependabot', 'renovate', 'renovate-bot', 'github-actions[bot]'];
  if (defaultBots.includes(normalized) || normalized.endsWith('[bot]')) {
    return true;
  }

  // 2. Custom ignored authors from config
  const ignored = getIgnoredAuthors();
  return ignored.includes(normalized);
}
