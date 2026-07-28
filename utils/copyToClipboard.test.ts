import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard } from './clipboard';

// ---------------------------------------------------------------------------
// Helpers to control navigator.clipboard across tests
// ---------------------------------------------------------------------------

function setClipboard(impl: Partial<Clipboard> | null) {
  Object.defineProperty(navigator, 'clipboard', {
    value: impl,
    writable: true,
    configurable: true,
  });
}

function setExecCommand(returnValue: boolean) {
  Object.defineProperty(document, 'execCommand', {
    value: vi.fn().mockReturnValue(returnValue),
    writable: true,
    configurable: true,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Modern Clipboard API available & succeeds ───────────────────────────

  it('resolves without throwing when navigator.clipboard.writeText succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    await expect(copyToClipboard('hello')).resolves.toBeUndefined();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('does not call fallback when navigator.clipboard.writeText succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    // define execCommand first so we can spy on it
    setExecCommand(false);
    const execCommandSpy = vi.spyOn(document, 'execCommand');

    await copyToClipboard('hello');

    expect(execCommandSpy).not.toHaveBeenCalled();
  });

  // ── Modern Clipboard API throws → falls back ────────────────────────────

  it('falls back to fallbackCopyToClipboard when navigator.clipboard.writeText throws', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'));
    setClipboard({ writeText });
    setExecCommand(true);

    await expect(copyToClipboard('fallback text')).resolves.toBeUndefined();
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('throws Error("Clipboard copy failed") when navigator.clipboard throws AND fallback fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'));
    setClipboard({ writeText });
    setExecCommand(false); // fallback also fails

    await expect(copyToClipboard('fail text')).rejects.toThrow('Clipboard copy failed');
  });

  // ── navigator.clipboard not available → uses fallback ──────────────────

  it('uses fallback when navigator.clipboard is null', async () => {
    setClipboard(null);
    setExecCommand(true);

    await expect(copyToClipboard('no clipboard')).resolves.toBeUndefined();
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('uses fallback when navigator.clipboard is undefined', async () => {
    setClipboard(undefined as unknown as null);
    setExecCommand(true);

    await expect(copyToClipboard('no clipboard')).resolves.toBeUndefined();
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('throws when navigator.clipboard is unavailable AND fallback returns false', async () => {
    setClipboard(null);
    setExecCommand(false);

    await expect(copyToClipboard('fail')).rejects.toThrow('Clipboard copy failed');
  });

  // ── Error message exactness ─────────────────────────────────────────────

  it('throws exactly Error("Clipboard copy failed") — not a different message', async () => {
    setClipboard(null);
    setExecCommand(false);

    await expect(copyToClipboard('x')).rejects.toThrow(new Error('Clipboard copy failed'));
  });

  // ── Passes the correct text through ────────────────────────────────────

  it('passes the exact text string to navigator.clipboard.writeText', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    const text = 'exact-text-123';
    await copyToClipboard(text);

    expect(writeText).toHaveBeenCalledWith(text);
  });

  it('passes the exact text string to the DOM fallback textarea', async () => {
    setClipboard(null);
    setExecCommand(true);

    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const text = 'textarea-text-456';
    await copyToClipboard(text);

    const textarea = appendSpy.mock.calls[0][0] as HTMLTextAreaElement;
    expect(textarea.value).toBe(text);
  });

  // ── Empty string edge case ──────────────────────────────────────────────

  it('handles empty string without throwing when clipboard is available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    await expect(copyToClipboard('')).resolves.toBeUndefined();
    expect(writeText).toHaveBeenCalledWith('');
  });

  it('handles empty string via fallback without throwing', async () => {
    setClipboard(null);
    setExecCommand(true);

    await expect(copyToClipboard('')).resolves.toBeUndefined();
  });
});
