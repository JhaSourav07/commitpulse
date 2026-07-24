import fs from 'node:fs';
import path from 'node:path';

/**
 * Reads and returns the list of ignored authors configured in the .commitpulse.json file.
 * Returns an empty array if the file does not exist or fails to parse.
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
 * Checks if the given username is an automated bot or dependency system.
 * Matches:
 * 1. Custom authors defined in the ignored_authors list inside .commitpulse.json
 * 2. Default common bot names (dependabot, renovate, semantic-release-bot)
 * 3. Usernames ending with [bot] or -bot
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
