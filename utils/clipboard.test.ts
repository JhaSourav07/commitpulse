import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fallbackCopyToClipboard } from './clipboard';

describe('fallbackCopyToClipboard', () => {
  let execCommandMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock document.execCommand
    execCommandMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully copy text to clipboard and return true', () => {
    const textToCopy = 'hello world';
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    const result = fallbackCopyToClipboard(textToCopy);

    expect(result).toBe(true);
    expect(execCommandMock).toHaveBeenCalledWith('copy');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    // Verify textarea element properties
    const textarea = appendChildSpy.mock.calls[0][0] as HTMLTextAreaElement;
    expect(textarea.value).toBe(textToCopy);
    expect(textarea.style.position).toBe('fixed');
    expect(textarea.style.opacity).toBe('0');
    expect(textarea.style.pointerEvents).toBe('none');
  });

  it('should return false if execCommand returns false', () => {
    execCommandMock.mockReturnValue(false);
    const result = fallbackCopyToClipboard('test text');
    expect(result).toBe(false);
  });

  it('should return false and clean up the textarea if an error is thrown during append', () => {
    // Force an error to be thrown during appendChild
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {
      throw new Error('DOM Error');
    });
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    const result = fallbackCopyToClipboard('error text');

    expect(result).toBe(false);
    expect(appendChildSpy).toHaveBeenCalled();
    // Since it threw during appendChild, document.body.contains(textArea) should be false,
    // so removeChild should not be called.
    expect(removeChildSpy).not.toHaveBeenCalled();
  });

  it('should call removeChild during finally if textarea was appended but error occurred later', () => {
    // Force an error to be thrown inside try block after appendChild, e.g., on select()
    const selectSpy = vi.spyOn(HTMLTextAreaElement.prototype, 'select').mockImplementation(() => {
      throw new Error('Selection Error');
    });
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    const result = fallbackCopyToClipboard('select error text');

    expect(result).toBe(false);
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    selectSpy.mockRestore();
  });
});
