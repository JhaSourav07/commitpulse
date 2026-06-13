import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewPanel } from './PreviewPanel';
import { act } from '@testing-library/react';

vi.mock('@/utils/clipboard', () => ({
  fallbackCopyToClipboard: vi.fn().mockReturnValue(true),
}));

describe('PreviewPanel massive scaling', () => {
  const createLargeMarkdown = () =>
    Array.from({ length: 5000 }, (_, i) => `# Section ${i}\n\nContent block ${i}\n`).join('\n');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders extremely large markdown payloads without crashing', () => {
    const markdown = createLargeMarkdown();

    render(<PreviewPanel markdown={markdown} />);

    expect(screen.getByText('README.md')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${markdown.length} chars`))).toBeInTheDocument();
  });

  it('renders large preview content while preserving preview panel structure', () => {
    const markdown = createLargeMarkdown();

    const { container } = render(<PreviewPanel markdown={markdown} />);

    const previewPanel = container.querySelector('#panel-preview');
    const readmePreview = container.querySelector('.readme-preview');

    expect(previewPanel).toBeInTheDocument();
    expect(readmePreview).toBeInTheDocument();

    const headings = readmePreview?.querySelectorAll('h1');
    expect(headings?.length).toBeGreaterThan(1000);
  });

  it('renders raw markdown view correctly for extremely large documents', () => {
    const markdown = createLargeMarkdown();

    render(<PreviewPanel markdown={markdown} />);

    fireEvent.click(
      screen.getByRole('tab', {
        name: /markdown/i,
      })
    );

    const rawPanel = screen.getByRole('tabpanel', {
      name: /markdown/i,
    });

    expect(rawPanel).toBeInTheDocument();
    expect(rawPanel.textContent).toContain('# Section 0');
    expect(rawPanel.textContent).toContain('# Section 4999');
  });

  it('maintains acceptable render performance under repeated mount cycles', () => {
    const markdown = Array.from({ length: 500 }, (_, i) => `# Section ${i}\n\nContent ${i}`).join(
      '\n'
    );

    const start = performance.now();

    for (let i = 0; i < 10; i++) {
      const { unmount } = render(<PreviewPanel markdown={markdown} />);

      unmount();
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10000);
  });

  it('supports copy operations with very large markdown payloads', async () => {
    const markdown = createLargeMarkdown();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });

    render(<PreviewPanel markdown={markdown} />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: /copy markdown text to clipboard/i,
        })
      );
    });

    expect(writeTextMock).toHaveBeenCalledWith(markdown);
  });
});
