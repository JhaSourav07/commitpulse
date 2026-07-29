/**
 * Fallback clipboard copy implementation using the legacy `document.execCommand('copy')`
 * approach. Used when the modern Clipboard API is unavailable.
 *
 * @param text - The string to copy to the clipboard
 * @returns `true` if the copy succeeded, `false` otherwise
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
 * Copies the given text to the system clipboard. Uses the modern Clipboard API
 * when available and falls back to the legacy `execCommand` approach otherwise.
 *
 * @param text - The string to copy to the clipboard
 * @returns A promise that resolves when the copy is complete, or rejects if it fails
 * @throws Error if both the Clipboard API and the fallback mechanism fail
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
