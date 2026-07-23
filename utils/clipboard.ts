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
