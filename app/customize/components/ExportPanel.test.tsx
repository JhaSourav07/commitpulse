import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { ExportPanel } from './ExportPanel';

// 🟢 Mock the browser clipboard API to prevent Vitest environment crashes
beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(() => Promise.resolve()),
    },
    configurable: true,
  });
});
describe('ExportPanel', () => {
  const renderPanel = (overrides?: Partial<Parameters<typeof ExportPanel>[0]>) => {
    const onFormatChange = vi.fn();
    const onCopy = vi.fn();

    render(
      <ExportPanel
        format="markdown"
        snippet="![CommitPulse](https://example.com/badge.svg)"
        copied={false}
        copyStatusMessage="Markdown snippet copied to clipboard."
        hasUsername
        username="octocat"
        onFormatChange={onFormatChange}
        onCopy={onCopy}
        {...overrides}
      />
    );

    return { onFormatChange, onCopy };
  };

  it("renders 'Markdown' button active by default", () => {
    renderPanel();

    const markdownButton = screen.getByRole('button', { name: 'Markdown' });

    expect(markdownButton.getAttribute('aria-pressed')).toBe('true');
    expect(markdownButton.className).toContain('bg-emerald-500/15');
  });

  it("renders 'HTML' button", () => {
    renderPanel();

    expect(screen.getByRole('button', { name: 'HTML' })).toBeDefined();
  });

  it("renders 'React TSX' button", () => {
    renderPanel();

    expect(screen.getByRole('button', { name: 'React TSX' })).toBeDefined();
  });

  it("calls onFormatChange with 'html' when HTML button is clicked", () => {
    const { onFormatChange } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'HTML' }));

    expect(onFormatChange).toHaveBeenCalledTimes(1);
    expect(onFormatChange).toHaveBeenCalledWith('html');
  });

  it("calls onFormatChange with 'tsx' when React TSX button is clicked", () => {
    const { onFormatChange } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'React TSX' }));

    expect(onFormatChange).toHaveBeenCalledTimes(1);
    expect(onFormatChange).toHaveBeenCalledWith('tsx');
  });

  it('disables the copy button when hasUsername is false', () => {
    renderPanel({ hasUsername: false, username: '', copied: false });

    const copyMarkdownButton = screen.getByRole('button', {
      name: /copy markdown export snippet to clipboard/i,
    }) as HTMLButtonElement;

    expect(copyMarkdownButton.disabled).toBe(true);
  });

  it('enables the copy button when hasUsername is true', () => {
    renderPanel();

    const copyButton = screen.getByRole('button', {
      name: /copy markdown export snippet to clipboard/i,
    }) as HTMLButtonElement;

    expect(copyButton.disabled).toBe(false);
  });

  it('calls onCopy when the copy button is clicked', async () => {
    const { onCopy } = renderPanel();

    fireEvent.click(
      screen.getByRole('button', {
        name: /copy markdown export snippet to clipboard/i,
      })
    );

    await vi.waitFor(() => {
      expect(onCopy).toHaveBeenCalledTimes(1);
    });
  });

  it("displays 'Copied!' on the button when copied prop is true", () => {
    renderPanel({ copied: true });

    expect(
      screen.getByRole('button', { name: /copy markdown export snippet to clipboard/i }).textContent
    ).toContain('Copied!');
  });

  it('renders the snippet prop content correctly within the code block', () => {
    const snippet = '![CommitPulse](https://example.com/custom.svg)';

    renderPanel({ snippet });

    expect(screen.getByText(snippet).textContent).toBe(snippet);
  });

  it('announces copy success through a polite live region', async () => {
    const { onCopy } = renderPanel({
      copied: true,
      copyStatusMessage: 'Markdown snippet copied to clipboard.',
    });

    const copyButton = screen.getByRole('button', {
      name: /copy markdown export snippet to clipboard/i,
    });

    fireEvent.click(copyButton);

    await vi.waitFor(() => {
      expect(onCopy).toHaveBeenCalledTimes(1);
      expect(copyButton.getAttribute('aria-describedby')).toBe('export-copy-status');
      expect(screen.getByRole('status').textContent).toBe('Markdown snippet copied to clipboard.');
      expect(copyButton.textContent).toBe('Copied!');
    });
  });
});
