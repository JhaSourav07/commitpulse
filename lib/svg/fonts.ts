import { sanitizeFont } from './sanitizer';

/**
 * Maps lowercase font shorthand keys to their full CSS font-family strings.
 *
 * Fonts listed here are treated as "predefined" — the generator resolves them
 * directly without emitting a second dynamic Google Fonts @import. Only add a
 * font here if it is ALREADY loaded by the unconditional @import in generator.ts
 * (Fira Code, JetBrains Mono, Roboto, Syncopate, Space Grotesk).
 *
 * Fonts NOT in this map (e.g. "Inter", "Orbitron") correctly fall through to
 * the dynamic @import path, fetching them from Google Fonts on demand.
 */
export const FONT_MAP = {
  // ── Pre-existing entries ────────────────────────────────────────────────
  jetbrains: '"JetBrains Mono", monospace',
  fira: '"Fira Code", monospace',
  roboto: '"Roboto", sans-serif',

  // ── Previously missing — both fonts are in the unconditional @import ───
  // Without these entries, passing ?font=syncopate or ?font=spacegrotesk
  // incorrectly triggers a duplicate dynamic Google Fonts fetch.
  syncopate: '"Syncopate", sans-serif',
  spacegrotesk: '"Space Grotesk", sans-serif',
  'space grotesk': '"Space Grotesk", sans-serif', // handles spaced user input

  // ── Aliases for common variations ───────────────────────────────────────
  firacode: '"Fira Code", monospace', // alias: fira is the canonical key
  'jetbrains mono': '"JetBrains Mono", monospace', // handles spaced user input
} as const;

/**
 * Resolve a font name to a CSS font-family string.
 * - If `font` matches a predefined key in `FONT_MAP` (case-insensitive), returns that stack.
 * - If `font` is a valid custom font name, returns `"<Font>", sans-serif`.
 * - Otherwise returns `null`.
 */
export function resolveFont(font?: string | null): string | null {
  const sanitized = sanitizeFont(font ?? undefined);
  if (!sanitized) return null;

  const key = sanitized.toLowerCase();
  const predefined = (FONT_MAP as Record<string, string>)[key];
  if (predefined) return predefined;

  return `"${sanitized}", sans-serif`;
}

export type FontKey = keyof typeof FONT_MAP;

export default FONT_MAP;
