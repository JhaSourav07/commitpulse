import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ExportPanel } from './ExportPanel';
import React from 'react';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string; format?: string }) =>
      options?.defaultValue ?? options?.format ?? _key,
  }),
}));

vi.mock('../utils', () => ({
  getPlaceholderSnippet: vi.fn(() => 'placeholder snippet'),
}));

const props = {
  format: 'markdown' as const,
  snippet: '![badge](https://commitpulse.vercel.app/api/badge?user=test)',
  copied: false,
  copyStatusMessage: '',
  hasUsername: true,
  username: 'octocat',
  onFormatChange: vi.fn(),
  onCopy: vi.fn(),
};

describe('ExportPanel mock integration', () => {
  beforeEach(() => {
    cleanup();

    vi.clearAllMocks();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue('<svg></svg>'),
        blob: vi.fn().mockResolvedValue(new Blob(['png'])),
      } satisfies Partial<Response>)
    );

    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn(),
      })
    );

    vi.spyOn(document.body, 'appendChild');
    vi.spyOn(document.body, 'removeChild');

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000/customize',
      },
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      vibrate: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders all export buttons', () => {
    render(<ExportPanel {...props} />);

    expect(screen.getByText(/Download SVG/i)).toBeInTheDocument();
    expect(screen.getByText(/Download PNG/i)).toBeInTheDocument();
    expect(screen.getByText(/Share Config/i)).toBeInTheDocument();
  });

  it('downloads svg using mocked fetch', async () => {
    render(<ExportPanel {...props} />);

    fireEvent.click(screen.getByText(/Download SVG/i));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('downloads png using mocked fetch', async () => {
    render(<ExportPanel {...props} />);

    fireEvent.click(screen.getByText(/Download PNG/i));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('copies configuration url', async () => {
    render(<ExportPanel {...props} />);

    fireEvent.click(screen.getByText(/Share Config/i));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/customize');
    });
  });

  it('revokes blob url after download', async () => {
    render(<ExportPanel {...props} />);

    fireEvent.click(screen.getByText(/Download SVG/i));

    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalled();
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });
  });
});
