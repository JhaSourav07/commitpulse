import { hexToRgb, getContrastRatio } from '../../utils/color';

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
 * Looks up the hex color for a given programming language.
 *
 * @param language - The language name (e.g. 'TypeScript', 'Python').
 * @returns The hex color string, or an empty string if the language is not found.
 */
export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? '';
}

/**
 * Looks up the hex color for a language, returning a custom fallback if not found.
 *
 * @param language - The language name.
 * @param fallback - The fallback hex color (defaults to '#767676').
 */
export function getLanguageColorOrDefault(language: string, fallback = '#767676'): string {
  return LANGUAGE_COLORS[language] ?? fallback;
}

/**
 * Looks up the language color and returns it alongside a contrasting text color
 * suitable for label/badge text (WCAG AA minimum contrast ratio of 4.5:1).
 *
 * @param language - The language name.
 * @returns An object with the language color and a contrasting color ('#000000' or '#ffffff').
 */
export function getLanguageColorWithContrast(
  language: string
): { color: string; contrastColor: string } {
  const color = getLanguageColor(language) || '#767676';

  const rgb = hexToRgb(color);
  if (!rgb) return { color, contrastColor: '#ffffff' };

  const whiteRatio = getContrastRatio(color, '#ffffff');
  const blackRatio = getContrastRatio(color, '#000000');

  return {
    color,
    contrastColor: whiteRatio >= blackRatio ? '#ffffff' : '#000000',
  };
}
