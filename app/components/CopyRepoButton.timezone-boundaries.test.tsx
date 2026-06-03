import { cleanup, render, screen, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CopyRepoButton, { REPO_URL } from './CopyRepoButton';

beforeEach(() => {
  vi.stubGlobal('navigator', {
    ...navigator,
    clipboard: { writeText: vi.fn() },
  });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  cleanup();
});

describe('CopyRepoButton', () => {
  it('renders with the default "Copy URL" label on mount', () => {
    render(<CopyRepoButton />);
    expect(screen.getByRole('button').textContent).toContain('Copy URL');
  });

  it('transitions to "Copied!" immediately after a successful clipboard write', async () => {
    vi.useFakeTimers();
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);
    render(<CopyRepoButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByRole('button').textContent).toContain('Copied!');
  });

  it('resets to "Copy URL" exactly after the 2000 ms timeout boundary', async () => {
    vi.useFakeTimers();
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);
    render(<CopyRepoButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByRole('button').textContent).toContain('Copied!');

    await act(async () => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getByRole('button').textContent).toContain('Copied!');

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('button').textContent).toContain('Copy URL');
  });

  it('shows "Copy failed" and resets after 2000 ms when the clipboard API rejects', async () => {
    vi.useFakeTimers();
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Not allowed'));
    render(<CopyRepoButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByRole('button').textContent).toContain('Copy failed');

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button').textContent).toContain('Copy URL');
  });

  it('writes the exact repo URL exported from the component to the clipboard', async () => {
    vi.useFakeTimers();
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);
    render(<CopyRepoButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(REPO_URL);
  });
});
