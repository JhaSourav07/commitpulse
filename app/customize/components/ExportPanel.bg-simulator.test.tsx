import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExportPanel } from './ExportPanel';

describe('ExportPanel GitHub Background Simulator', () => {
  it('renders Dark, Light, and Grid background simulator buttons when onPreviewBgChange is provided', () => {
    const onPreviewBgChange = vi.fn();

    render(
      <ExportPanel
        format="markdown"
        snippet="![CommitPulse](https://example.com/badge.svg)"
        copied={false}
        copyStatusMessage=""
        hasUsername
        username="octocat"
        onFormatChange={vi.fn()}
        onCopy={vi.fn()}
        previewBg="dark"
        onPreviewBgChange={onPreviewBgChange}
      />
    );

    const darkBtn = screen.getByRole('button', { name: /dark/i });
    const lightBtn = screen.getByRole('button', { name: /light/i });
    const gridBtn = screen.getByRole('button', { name: /grid/i });

    expect(darkBtn).toBeDefined();
    expect(lightBtn).toBeDefined();
    expect(gridBtn).toBeDefined();

    expect(darkBtn.getAttribute('aria-pressed')).toBe('true');
    expect(lightBtn.getAttribute('aria-pressed')).toBe('false');
    expect(gridBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('triggers onPreviewBgChange with correct mode when background simulator buttons are clicked', () => {
    const onPreviewBgChange = vi.fn();

    render(
      <ExportPanel
        format="markdown"
        snippet="![CommitPulse](https://example.com/badge.svg)"
        copied={false}
        copyStatusMessage=""
        hasUsername
        username="octocat"
        onFormatChange={vi.fn()}
        onCopy={vi.fn()}
        previewBg="dark"
        onPreviewBgChange={onPreviewBgChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /light/i }));
    expect(onPreviewBgChange).toHaveBeenCalledWith('light');

    fireEvent.click(screen.getByRole('button', { name: /grid/i }));
    expect(onPreviewBgChange).toHaveBeenCalledWith('checkerboard');

    fireEvent.click(screen.getByRole('button', { name: /dark/i }));
    expect(onPreviewBgChange).toHaveBeenCalledWith('dark');
  });
});
