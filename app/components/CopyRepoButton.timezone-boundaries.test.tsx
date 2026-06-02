import React from 'react';
import { cleanup, render, screen, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CopyRepoButton from './CopyRepoButton';

const REPO_URL = 'https://github.com/JhaSourav07/commitpulse';

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn() },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

describe('CopyRepoButton — timezone-boundaries', () => {
  it('renders with the default "Copy URL" label regardless of system timezone', () => {
    // The button label must be stable across UTC, EST, IST, JST and any locale.
    render(<CopyRepoButton />);
    expect(screen.getByRole('button').textContent).toContain('Copy URL');
  });

  it('transitions to "Copied!" immediately after a successful clipboard write', async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);
    render(<CopyRepoButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByRole('button').textContent).toContain('Copied!');
  });

  it('resets to "Copy URL" exactly after the 2000 ms timeout boundary', async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);
    render(<CopyRepoButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByRole('button').textContent).toContain('Copied!');

    // Advance to just before the boundary — label should not yet reset.
    await act(async () => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getByRole('button').textContent).toContain('Copied!');

    // Cross the 2000 ms boundary — label must reset.
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('button').textContent).toContain('Copy URL');
  });

  it('shows "Copy failed" and resets after 2000 ms when the clipboard API rejects', async () => {
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

  it('writes the exact repo URL to the clipboard, unaffected by locale or timezone', async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);
    render(<CopyRepoButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(REPO_URL);
  });
});
