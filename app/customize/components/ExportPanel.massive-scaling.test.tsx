import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExportPanel } from './ExportPanel';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ExportPanel massive scaling', () => {
  const largeSnippet = Array.from(
    { length: 5000 },
    (_, i) => `Contributor action ${i} - github activity log`
  ).join('\n');

  const props = {
    format: 'markdown' as const,
    snippet: largeSnippet,
    copied: false,
    copyStatusMessage: '',
    hasUsername: true,
    username: 'test-user',
    onFormatChange: vi.fn(),
    onCopy: vi.fn(),
  };

  it('renders huge data without crashing', () => {
    render(<ExportPanel {...props} />);

    expect(screen.getByText(/Contributor action 0/)).toBeInTheDocument();
  });

  it('handles thousands of lines of content', () => {
    render(<ExportPanel {...props} />);

    expect(screen.getByText(/Contributor action 4999/)).toBeInTheDocument();
  });

  it('keeps code block wrapping enabled for large content', () => {
    render(<ExportPanel {...props} />);

    const code = document.querySelector('code');

    expect(code).toHaveClass('break-all');
    expect(code).toHaveClass('whitespace-pre-wrap');
  });

  it('renders export controls with large snippets', () => {
    render(<ExportPanel {...props} />);

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('renders large content within acceptable time', () => {
    const start = performance.now();

    render(<ExportPanel {...props} />);

    const end = performance.now();

    expect(end - start).toBeLessThan(1000);
  });
});
