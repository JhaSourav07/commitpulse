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
