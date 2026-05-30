import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExportPanel } from './ExportPanel';

describe('ExportPanel', () => {
  it('announces copy success through a polite live region', () => {
    const onCopy = vi.fn();

    render(
      <ExportPanel
        format="markdown"
        snippet="![CommitPulse](https://commitpulse.vercel.app/api/streak?user=octocat)"
        copied
        copyStatusMessage="Markdown snippet copied to clipboard."
        hasUsername
        username="octocat"
        onFormatChange={vi.fn()}
        onCopy={onCopy}
      />
    );

    const copyButton = screen.getByRole('button', {
      name: /copy markdown export snippet to clipboard/i,
    });

    fireEvent.click(copyButton);

    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(copyButton.getAttribute('aria-describedby')).toBe('export-copy-status');
    expect(screen.getByRole('status').textContent).toBe('Markdown snippet copied to clipboard.');
    expect(screen.getByText('Copied!')).toBeDefined();
  });
});
