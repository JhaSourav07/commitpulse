// app/not-found.empty-fallback.test.tsx

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { toast } from 'sonner';

vi.mock('next/link', () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import NotFound from './not-found';

describe('NotFound Component - Empty & Missing Input Fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    });
  });

  it('renders successfully with default empty layout state and correct header', () => {
    expect(() => render(<NotFound />)).not.toThrow();

    // Verify backdrop headers exist and standard styling markers are present
    expect(screen.getAllByText('404')).toHaveLength(3);
    expect(
      screen.getByRole('heading', {
        name: /Looks like this commit got force-pushed to \/dev\/null/i,
      })
    ).toBeInTheDocument();

    // Verify links exist
    const gitCheckoutMainLink = screen.getByRole('link', { name: 'git checkout main' });
    expect(gitCheckoutMainLink).toBeInTheDocument();
    expect(gitCheckoutMainLink).toHaveAttribute(
      'href',
      'https://github.com/JhaSourav07/commitpulse'
    );
    expect(gitCheckoutMainLink).toHaveAttribute('target', '_blank');

    const goBackHomeLink = screen.getByRole('link', { name: 'Go back home' });
    expect(goBackHomeLink).toBeInTheDocument();
    expect(goBackHomeLink).toHaveAttribute('href', '/');
  });

  it('verifies that the terminal mock exhibits the correct Git command string and hint text', () => {
    render(<NotFound />);

    // Check key DOM text structures in the bash emulation UI
    expect(screen.getByText('commitpulse — bash')).toBeInTheDocument();
    expect(screen.getByText('git checkout')).toBeInTheDocument();
    expect(screen.getByText('this-page')).toBeInTheDocument();
    expect(
      screen.getByText(/The page you're looking for has been rebased out of existence/i)
    ).toBeInTheDocument();
    expect(screen.getByText('hint: Did you mean some other username?')).toBeInTheDocument();
  });

  it('triggers clipboard copy successfully and calls toast.success', async () => {
    render(<NotFound />);

    const terminalContainer = screen.getByText('commitpulse — bash').closest('div');
    expect(terminalContainer).toBeInTheDocument();

    if (terminalContainer) {
      await fireEvent.click(terminalContainer);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('git checkout this-page')
      );
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Terminal output copied!');
    }
  });

  it('handles clipboard writeText rejection gracefully and calls toast.error', async () => {
    // Override writeText to reject
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Clipboard error'));

    render(<NotFound />);

    const terminalContainer = screen.getByText('commitpulse — bash').closest('div');
    expect(terminalContainer).toBeInTheDocument();

    if (terminalContainer) {
      await fireEvent.click(terminalContainer);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Failed to copy terminal output');
    }
  });

  it('handles missing navigator.clipboard gracefully and calls toast.error without crashing', async () => {
    // Delete navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    render(<NotFound />);

    const terminalContainer = screen.getByText('commitpulse — bash').closest('div');
    expect(terminalContainer).toBeInTheDocument();

    if (terminalContainer) {
      await fireEvent.click(terminalContainer);
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Failed to copy terminal output');
    }
  });
});
