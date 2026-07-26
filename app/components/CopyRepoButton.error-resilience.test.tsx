import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import CopyRepoButton from './CopyRepoButton';

vi.mock('lucide-react', () => ({
  Copy: () => <svg data-testid="copy-icon" />,
}));

describe('CopyRepoButton error resilience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders successfully during initial mount', () => {
    render(<CopyRepoButton />);

    expect(screen.getByRole('button', { name: /copy url/i })).toBeDefined();
  });

  it('does not crash when clipboard write rejects', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard failed')),
      },
    });

    render(<CopyRepoButton />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDefined();
    });
  });

  it('keeps original label visible after clipboard failure', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard failed')),
      },
    });

    render(<CopyRepoButton />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/copy url/i)).toBeDefined();
    });
  });

  it('renders icon even when copy action fails', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard failed')),
      },
    });

    render(<CopyRepoButton />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByTestId('copy-icon')).toBeDefined();
    });
  });

  it('allows repeated failed copy attempts without crashing', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard failed')),
      },
    });

    render(<CopyRepoButton />);

    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDefined();
    });
  });
});
