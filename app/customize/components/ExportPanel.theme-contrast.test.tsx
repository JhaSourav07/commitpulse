import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { ExportPanel } from './ExportPanel';

const defaultProps = {
  format: 'markdown' as const,
  snippet: '![badge](https://example.com/badge.svg)',
  copied: false,
  copyStatusMessage: '',
  hasUsername: true,
  username: 'john',
  onFormatChange: vi.fn(),
  onCopy: vi.fn(),
};

describe('ExportPanel - Theme Contrast & Visual Cohesion', () => {
  it('verifies dark and light background/border contrast classes on the outer container', () => {
    const { container } = render(<ExportPanel {...defaultProps} />);

    const mainContainer = container.firstElementChild;

    expect(mainContainer).toHaveClass('flex');
    expect(mainContainer).toHaveClass('flex-col');
    expect(mainContainer).toHaveClass('gap-4');
  });

  it('verifies visual cohesion classes on export format selector buttons', () => {
    render(<ExportPanel {...defaultProps} />);

    const markdownButton = screen.getByRole('button', {
      name: 'Markdown',
    });

    const htmlButton = screen.getByRole('button', {
      name: 'HTML',
    });

    expect(markdownButton).toHaveClass('text-emerald-600');
    expect(markdownButton).toHaveClass('dark:text-emerald-300');

    expect(htmlButton).toHaveClass('text-zinc-400');
    expect(htmlButton).toHaveClass('dark:text-white/35');
  });
  it('verifies export format selector container maintains contrast styling', () => {
    render(<ExportPanel {...defaultProps} />);

    const selector = screen.getByLabelText('Export format');

    expect(selector).toHaveClass('border-black/10');
    expect(selector).toHaveClass('bg-white/60');
    expect(selector).toHaveClass('dark:border-white/10');
    expect(selector).toHaveClass('dark:bg-white/[0.03]');
  });

  it('verifies code snippet container and code block maintain readable contrast', () => {
    const { container } = render(<ExportPanel {...defaultProps} />);

    const codeElement = container.querySelector('code');

    expect(codeElement).toHaveClass('text-emerald-600');
    expect(codeElement).toHaveClass('dark:text-emerald-300');

    const snippetContainer = codeElement?.parentElement;

    expect(snippetContainer).toHaveClass('bg-gray-100/80');
    expect(snippetContainer).toHaveClass('dark:bg-white/[0.03]');
    expect(snippetContainer).toHaveClass('border-black/10');
    expect(snippetContainer).toHaveClass('dark:border-white/10');
  });

  it('verifies disabled action buttons maintain accessible contrast styling', () => {
    render(<ExportPanel {...defaultProps} hasUsername={false} />);

    const copyButton = screen.getByRole('button', {
      name: /enable copying/i,
    });

    const downloadButton = screen.getByRole('button', {
      name: /enable image downloads/i,
    });

    expect(copyButton).toHaveClass('text-gray-500');
    expect(copyButton).toHaveClass('dark:text-white/35');
    expect(copyButton).toHaveClass('bg-gray-200/90');
    expect(copyButton).toHaveClass('dark:bg-white/10');

    expect(downloadButton).toHaveClass('text-gray-500');
    expect(downloadButton).toHaveClass('dark:text-white/35');
    expect(downloadButton).toHaveClass('bg-gray-200/90');
    expect(downloadButton).toHaveClass('dark:bg-white/10');
  });
});
