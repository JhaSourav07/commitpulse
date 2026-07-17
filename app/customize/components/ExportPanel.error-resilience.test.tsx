import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ExportFormat } from '../types';
import { ExportPanel } from './ExportPanel';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
  }),
}));

const baseProps = {
  format: 'markdown' as ExportFormat,
  snippet: '[CommitPulse](https://commitpulse.vercel.app/api/badge?u=octocat)',
  copied: false,
  copyStatusMessage: '',
  hasUsername: true,
  username: 'octocat',
  onFormatChange: vi.fn(),
  onCopy: vi.fn(),
};

function getButtonByText(text: string): HTMLElement {
  return screen.getByText(text).closest('button') as HTMLElement;
}

describe('ExportPanel exception safety & error fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      configurable: true,
      writable: true,
    });
  });

  it('handleDownloadBadge: recovers cleanly and surfaces a toast when fetch is rejected (network failure)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network down'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ExportPanel {...baseProps} />);

    fireEvent.click(getButtonByText('Download SVG'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to retrieve the latest badge asset. Please try again.'
      );
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(screen.getByText('Download SVG')).toBeInTheDocument();
    expect(screen.getByText('Share Config')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('handleDownloadBadge: resets isDownloading via finally and notifies the user when the badge URL cannot be parsed', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ExportPanel {...baseProps} snippet="no url in here at all" />);

    fireEvent.click(getButtonByText('Download SVG'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Could not determine badge URL.');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Could not parse the live API badge target URL from snippet.'
    );
    expect(screen.getByText('Download SVG')).toBeInTheDocument();
    expect(screen.queryByText('Downloading...')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('handleDownloadBadge: a non-ok HTTP response is treated as an exception and handled the same way as a network failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ExportPanel {...baseProps} />);

    fireEvent.click(getButtonByText('Download SVG'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to retrieve the latest badge asset. Please try again.'
      );
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(screen.getByText('Download SVG')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('handleDownloadPng: fetch rejection is caught with its own message and isDownloading always resets via finally', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network down'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ExportPanel {...baseProps} />);

    fireEvent.click(getButtonByText('Download PNG'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to download PNG badge.');
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(screen.getByText('Download PNG')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('Share Config: a rejected clipboard write is caught, logged, and surfaced as a toast instead of crashing', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('Permission denied')) },
      configurable: true,
      writable: true,
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ExportPanel {...baseProps} />);

    fireEvent.click(getButtonByText('Share Config'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to copy configuration URL');
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy URL', expect.any(Error));
    expect(getButtonByText('Share Config')).toBeEnabled();

    consoleErrorSpy.mockRestore();
  });
});
