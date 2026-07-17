import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PreviewPanel } from './PreviewPanel';

vi.mock('@/utils/clipboard', () => ({
  fallbackCopyToClipboard: vi.fn(() => true),
}));

describe('PreviewPanel Mock Integrations', () => {
  const markdown = '# CommitPulse\nMock integration test';

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. copies markdown using mocked clipboard service', async () => {
    render(<PreviewPanel markdown={markdown} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: /copy markdown text to clipboard/i,
      })
    );

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(markdown);
    });
  });

  it('2. downloads markdown using mocked browser APIs', () => {
    const clickMock = vi.fn();

    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement('a');
        anchor.click = clickMock;
        return anchor;
      }

      return originalCreateElement(tagName);
    });

    render(<PreviewPanel markdown={markdown} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: /download readme\.md/i,
      })
    );

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
  });

  it('3. renders preview content while integrations are mocked', () => {
    render(<PreviewPanel markdown="# Hello World" />);

    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('4. switches between preview and markdown tabs', () => {
    render(<PreviewPanel markdown={markdown} />);

    fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));

    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    expect(screen.getByText(/CommitPulse/)).toBeInTheDocument();
    expect(screen.getByText(/Mock integration test/)).toBeInTheDocument();
  });

  it('5. keeps mocked services isolated across repeated interactions', async () => {
    render(<PreviewPanel markdown={markdown} />);

    const copyButton = screen.getByRole('button', {
      name: /copy markdown text to clipboard/i,
    });

    fireEvent.click(copyButton);
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2);
    });
  });
});
