/**
 * Browser clipboard copy utilities for CommitPulse.
 *
 * Provides a primary async path via the modern Clipboard API (navigator.clipboard)
 * with a fallback to the legacy document.execCommand('copy') technique for older
 * browsers or when the Clipboard API is unavailable.
 *
 * @module
 */

/**
 * Legacy clipboard copy fallback using a hidden textarea and document.execCommand.
 *
 * Creates an off-screen textarea element, appends it to the DOM, focuses it,
 * selects its contents, and calls `execCommand('copy')`. The textarea is removed
 * in the `finally` block to keep the DOM clean regardless of outcome.
 *
 * This function is only called in environments where `navigator.clipboard` is
 * absent (e.g. older browsers, cross-origin iframes without permission, or
 * non-browser environments where `document` is undefined).
 *
 * @param text - The string value to copy to the clipboard.
 * @returns `true` if the copy command succeeded, `false` if the browser denied
 *   the operation or `document` was unavailable.
 *
 * @remarks
 * `execCommand('copy')` is considered legacy but remains the only reliable
 * fallback for older environments. Modern browsers prefer the asynchronous
 * Clipboard API used in `copyToClipboard`.
 *
 * @example
 * ```ts
 * const ok = fallbackCopyToClipboard('hello world');
 * console.log(ok ? 'copied' : 'blocked');
 * ```
 */
export const fallbackCopyToClipboard = (text: string): boolean => {
  const textArea = document.createElement('textarea');

  try {
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';

    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    if (document.body.contains(textArea)) {
      document.body.removeChild(textArea);
    }
  }
};

/**
 * Asynchronously copies the given text to the system clipboard.
 *
 * Tries the modern asynchronous Clipboard API (`navigator.clipboard.writeText`)
 * first. On failure (e.g. permission denied, insecure context), falls back to
 * `fallbackCopyToClipboard`. If that also fails, rejects with an Error.
 *
 * @param text - The string to copy to the clipboard.
 * @returns A Promise that resolves when the text has been copied, or rejects
 *   if both the Clipboard API and the fallback failed.
 * @throws {Error} When both the Clipboard API and the legacy fallback fail.
 *
 * @example
 * ```ts
 * await copyToClipboard('https://commitpulse.dev/user/octocat');
 * ```
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Ignore error and fall through to fallback
    }
  }

  const success = fallbackCopyToClipboard(text);
  if (!success) {
    throw new Error('Clipboard copy failed');
  }
};
