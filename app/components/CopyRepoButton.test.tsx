import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CopyRepoButton, { REPO_URL } from './CopyRepoButton';

describe('CopyRepoButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // Test 1: Rendering and initial state
  it('renders with default copy text', () => {
    render(<CopyRepoButton />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Copy URL');
  });

  // Test 2: Clipboard API is called with correct URL
  it('copies repository URL to clipboard when clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CopyRepoButton />);
    const button = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(button);
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(REPO_URL);
  });

  // Test 3: Button label changes to 'Copied!'
  it('changes button label to Copied! upon successful copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CopyRepoButton />);
    const button = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(button);
      // Wait for the promise to resolve and state to update
      await Promise.resolve();
    });

    expect(button).toHaveTextContent('Copied!');
  });

  // Test 4: Button reverts after timeout
  it('reverts to normal state after timeout duration', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CopyRepoButton />);
    const button = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
    });

    expect(button).toHaveTextContent('Copied!');

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(button).toHaveTextContent('Copy URL');
  });

  // Test 5: Handle clipboard failure
  it('handles clipboard failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard permission denied'));
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CopyRepoButton />);
    const button = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
    });

    expect(button).toHaveTextContent('Copy failed');

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(button).toHaveTextContent('Copy URL');
    consoleSpy.mockRestore();
  });
});
