import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CopyRepoButton from './CopyRepoButton';

describe('CopyRepoButton mouse interactivity', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders copy button', () => {
    render(<CopyRepoButton />);

    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
  });

  it('copies repository url on click', async () => {
    render(<CopyRepoButton />);

    const button = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(button);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('shows copied state after successful click', async () => {
    render(<CopyRepoButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByText('Copied!')).toBeTruthy();
  });

  it('resets copied state after timeout', async () => {
    render(<CopyRepoButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByText('Copied!')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('Copied!')).toBeNull();
  });

  it('shows error state when clipboard write fails', async () => {
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('copy failed')
    );

    render(<CopyRepoButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    // Check that copied text is NOT shown when copy fails
    expect(screen.queryByText('Copied!')).toBeNull();
  });
});
