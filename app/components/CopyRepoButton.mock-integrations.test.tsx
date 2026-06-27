import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CopyRepoButton from './CopyRepoButton';

vi.mock('lucide-react', () => ({
  Copy: () => <svg data-testid="copy-icon" />,
}));

describe('CopyRepoButton mock integrations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls the clipboard service when the button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CopyRepoButton />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });
  });

  it('handles delayed async clipboard resolution', async () => {
    let resolveClipboard!: () => void;

    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveClipboard = resolve;
        })
    );

    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CopyRepoButton />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toBeDefined();

    resolveClipboard();

    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeDefined();
    });
  });

  it('handles permission denied errors gracefully', async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException('Permission denied'));

    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CopyRepoButton />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/copy failed/i)).toBeDefined();
    });
  });

  it('recovers after a failed copy attempt followed by a successful one', async () => {
    const writeText = vi
      .fn()
      .mockRejectedValueOnce(new Error('Clipboard failed'))
      .mockResolvedValueOnce(undefined);

    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CopyRepoButton />);

    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/copy failed/i)).toBeDefined();
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeDefined();
    });

    expect(writeText).toHaveBeenCalledTimes(2);
  });

  it('supports multiple rapid copy attempts without crashing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CopyRepoButton />);

    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(3);
    });

    expect(screen.getByRole('button')).toBeDefined();
  });
});
