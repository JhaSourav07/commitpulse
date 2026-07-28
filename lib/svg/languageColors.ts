/**
 * GitHub language colour map and lookup utilities.
 *
 * Provides the canonical colour mapping used by CommitPulse's language badges and
 * SVG generators. Colours follow GitHub's convention so they are immediately
 * recognisable in badge renders.
 *
 * @module
 */

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Lua: '#000080',
  R: '#198CE7',
  Scala: '#c22d40',
  Perl: '#0298c3',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

/**
 * Looks up the canonical hex colour for a given programming language.
 *
 * The lookup is case-sensitive and exact; partial matches are not performed.
 * Unknown languages return an empty string.
 *
 * @param language - The exact name of the programming language (e.g. "TypeScript").
 * @returns The six-digit hex colour string with a leading `#`, or an empty string
 *   if the language is not in `LANGUAGE_COLORS`.
 *
 * @example
 * ```ts
 * getLanguageColor('TypeScript') // '#3178c6'
 * getLanguageColor('Python')     // '#3572A5'
 * getLanguageColor('Zig')        // ''
 * ```
 */
export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? '';
}

/**
 * Looks up the canonical hex colour for a language, falling back to a custom colour.
 *
 * @param language - The exact name of the programming language.
 * @param fallback - The hex colour to return when `language` is not in `LANGUAGE_COLORS`.
 *   Should be a 6-digit hex string with a leading `#`.
 * @returns The matched colour from `LANGUAGE_COLORS`, or `fallback` if the language
 *   is unknown.
 *
 * @example
 * ```ts
 * getLanguageColorOrDefault('Rust', '#aaaaaa') // '#dea584'
 * getLanguageColorOrDefault('Zig', '#888888')  // '#888888'
 * ```
 */
export function getLanguageColorOrDefault(language: string, fallback: string): string {
  return LANGUAGE_COLORS[language] ?? fallback;
}

/**
 * Returns the language colour alongside a contrasting text colour suitable for
 * rendering on top of that background.
 *
 * Uses a simple luminance heuristic: light language colours (luminance > 0.179,
 * the WCAG threshold for black text) pair with `#24292f`; dark colours pair with
 * `#ffffff`.
 *
 * @param language - The exact name of the programming language.
 * @returns An object with `color` (the language's hex colour) and `contrastColor`
 *   (`#24292f` for light backgrounds, `#ffffff` for dark).
 *
 * @example
 * ```ts
 * getLanguageColorWithContrast('JavaScript') // { color: '#f1e05a', contrastColor: '#24292f' }
 * getLanguageColorWithContrast('Python')     // { color: '#3572A5', contrastColor: '#ffffff' }
 * ```
 */
export function getLanguageColorWithContrast(language: string): {
  color: string;
  contrastColor: string;
} {
  const color = getLanguageColor(language);
  if (!color) {
    return { color: '', contrastColor: '#ffffff' };
  }

  // Strip leading # if present
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // WCAG relative luminance formula
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // WCAG threshold for black text on light backgrounds
  const contrastColor = luminance > 0.179 ? '#24292f' : '#ffffff';

  return { color: `#${hex}`, contrastColor };
}
