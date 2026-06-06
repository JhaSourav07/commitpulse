import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExportPanel } from './ExportPanel';

describe('ExportPanel mouse interactivity', () => {
  const renderPanel = () => {
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
      />
    );

    return { onFormatChange, onCopy };
  };

  it('keeps format buttons interactive on mouse enter', () => {
    renderPanel();

    const htmlButton = screen.getByRole('button', { name: 'HTML' });

    fireEvent.mouseEnter(htmlButton);

    expect(htmlButton).toBeEnabled();
  });

  it('preserves hover transition styling on format buttons', () => {
    renderPanel();

    const tsxButton = screen.getByRole('button', { name: 'React TSX' });

    fireEvent.mouseOver(tsxButton);

    expect(tsxButton.className).toContain('transition-all');
    expect(tsxButton.className).toContain('hover:text-black');
  });

  it('supports click propagation after hover on format option', () => {
    const { onFormatChange } = renderPanel();

    const htmlButton = screen.getByRole('button', { name: 'HTML' });

    fireEvent.mouseEnter(htmlButton);
    fireEvent.click(htmlButton);

    expect(onFormatChange).toHaveBeenCalledWith('html');
  });

  it('keeps copy action available after mouse leave', () => {
    const { onCopy } = renderPanel();

    const copyButton = screen.getByRole('button', {
      name: /copy markdown export snippet to clipboard/i,
    });

    fireEvent.mouseEnter(copyButton);
    fireEvent.mouseLeave(copyButton);
    fireEvent.click(copyButton);

    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('propagates touch interaction to the copy button', () => {
    const { onCopy } = renderPanel();

    const copyButton = screen.getByRole('button', {
      name: /copy markdown export snippet to clipboard/i,
    });

    fireEvent.touchStart(copyButton);
    fireEvent.touchEnd(copyButton);
    fireEvent.click(copyButton);

    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});
