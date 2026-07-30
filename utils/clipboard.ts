/**
 * A browser-only fallback for copying text to the clipboard using a textarea
 * and `document.execCommand('copy')`. Used when the Clipboard API is unavailable.
 *
 * @param text - The string to copy.
 * @returns true if the copy succeeded, false otherwise.
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
 * Copies the given text to the system clipboard.
 * Tries the modern Clipboard API first, then falls back to the textarea approach.
 *
 * @param text - The string to copy.
 * @throws Error if both the Clipboard API and the fallback fail.
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
