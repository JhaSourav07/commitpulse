import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CodeBlock } from './code-block';

// Mock Lucide icons if needed
vi.mock('lucide-react', async (importOriginal) => {
  const original = await importOriginal<typeof import('lucide-react')>();
  return {
    ...original,
  };
});

describe('CodeBlock - Edge Cases & Empty/Missing Inputs Verification', () => {
  const writeTextMock = vi.fn();
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    writeTextMock.mockReset();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
      writable: true,
    });
  });

  // ── Empty/Null/Undefined Inputs ──────────────────────────────────────────────

  it('renders successfully with an empty string code', () => {
    render(<CodeBlock code="" />);
    const codeElement = screen
      .getByRole('button', { name: /copy/i })
      .closest('div')
      ?.querySelector('code');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.textContent).toBe('');
  });

  it('renders successfully with a null code parameter (type casting)', () => {
    // Cast to any to simulate Javascript dynamic runtime execution with missing types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => render(<CodeBlock code={null as any} />)).not.toThrow();
    const codeElement = screen
      .getByRole('button', { name: /copy/i })
      .closest('div')
      ?.querySelector('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('renders successfully with an undefined code parameter (type casting)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => render(<CodeBlock code={undefined as any} />)).not.toThrow();
    const codeElement = screen
      .getByRole('button', { name: /copy/i })
      .closest('div')
      ?.querySelector('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('maintains the standard DOM structures (pre and button) in empty states', () => {
    const { container } = render(<CodeBlock code="" />);
    expect(container.querySelector('pre')).toBeInTheDocument();
    expect(container.querySelector('code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('handles clipboard writing gracefully when clicked with empty code', async () => {
    writeTextMock.mockResolvedValue(undefined);
    render(<CodeBlock code="" />);

    const copyButton = screen.getByRole('button', { name: /copy code snippet/i });
    fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith('');
    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });

  // ── Multi-line code ─────────────────────────────────────────────────────────

  it('preserves multi-line code verbatim inside <code>', () => {
    const multiLine = 'line one\nline two\nline three';
    const { container } = render(<CodeBlock code={multiLine} />);
    expect(container.querySelector('code')!.textContent).toBe(multiLine);
  });

  // ── Clipboard failure ───────────────────────────────────────────────────────

  it('does not crash and stays in Copy state when clipboard.writeText rejects', async () => {
    writeTextMock.mockRejectedValue(new Error('Permission denied'));
    render(<CodeBlock code="fail-case" />);
    fireEvent.click(screen.getByRole('button', { name: /copy code snippet/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy code snippet/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /copied snippet/i })).toBeNull();
  });

  // ── aria-label transitions ──────────────────────────────────────────────────

  it('aria-label updates to "Copied snippet" immediately after a successful copy', async () => {
    writeTextMock.mockResolvedValue(undefined);
    render(<CodeBlock code="aria-test" />);
    fireEvent.click(screen.getByRole('button', { name: /copy code snippet/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied snippet/i })).toBeInTheDocument();
    });
  });

  it('aria-label reverts to "Copy code snippet" after the 2 s timeout', async () => {
    vi.useFakeTimers();
    writeTextMock.mockResolvedValue(undefined);
    render(<CodeBlock code="aria-revert" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy code snippet/i }));
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: /copied snippet/i })).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByRole('button', { name: /copy code snippet/i })).toBeInTheDocument();
  });

  // ── Unmount during countdown ────────────────────────────────────────────────

  it('clears the reset timeout on unmount — no setState-after-unmount warning', async () => {
    vi.useFakeTimers();
    writeTextMock.mockResolvedValue(undefined);
    const { unmount } = render(<CodeBlock code="unmount-test" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy code snippet/i }));
      await Promise.resolve();
    });
    expect(() => unmount()).not.toThrow();
  });

  // ── Rapid double-click ──────────────────────────────────────────────────────

  it('second click before timeout resets the countdown instead of queuing a second one', async () => {
    vi.useFakeTimers();
    writeTextMock.mockResolvedValue(undefined);
    render(<CodeBlock code="double-click" />);

    // First click
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy code snippet/i }));
      await Promise.resolve();
    });

    // Advance halfway through the first countdown
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByRole('button', { name: /copied snippet/i })).toBeInTheDocument();

    // Second click — resets the timer
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copied snippet/i }));
      await Promise.resolve();
    });

    // 1 s past the second click — still in Copied state
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByRole('button', { name: /copied snippet/i })).toBeInTheDocument();

    // 2 s past the second click — reverts to Copy
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByRole('button', { name: /copy code snippet/i })).toBeInTheDocument();
  });
});
