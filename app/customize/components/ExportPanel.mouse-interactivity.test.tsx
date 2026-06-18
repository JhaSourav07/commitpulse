import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ExportPanel } from './ExportPanel';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../utils', () => ({
  getPlaceholderSnippet: () => '<!-- placeholder snippet -->',
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { defaultValue?: string }) => {
      if (params?.defaultValue) return params.defaultValue;

      const translations: Record<string, string> = {
        'customize.export.markdown': 'Markdown',
        'customize.export.html': 'HTML',
        'customize.export.tsx': 'React TSX',
        'customize.export.action': 'GitHub Action',
        'customize.export.copy_aria_enabled': 'Copy Markdown export snippet to clipboard',
        'customize.export.copy_aria_disabled':
          'Add a GitHub username to enable copying the Markdown export snippet',
        'customize.export.download_svg': 'Download SVG',
        'customize.export.download_png': 'Download PNG',
        'customize.export.copy_format': 'Copy Markdown',
        'customize.export.footer_tip':
          "Paste this into your GitHub profile's README.md. The badge renders server-side, no script required.",
      };

      return translations[key] ?? key;
    },
  }),
}));

const defaultProps = {
  format: 'markdown' as const,
  snippet: '![CommitPulse](https://example.com/badge.svg)',
  copied: false,
  copyStatusMessage: 'Markdown snippet copied to clipboard.',
  hasUsername: true,
  username: 'octocat',
  onFormatChange: vi.fn(),
  onCopy: vi.fn(),
};

describe('ExportPanel Mouse Interactivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers format change when HTML button is clicked', () => {
    const onFormatChange = vi.fn();

    render(<ExportPanel {...defaultProps} onFormatChange={onFormatChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'HTML' }));

    expect(onFormatChange).toHaveBeenCalledTimes(1);
    expect(onFormatChange).toHaveBeenCalledWith('html');
  });

  it('triggers copy callback when copy button is clicked', () => {
    const onCopy = vi.fn();

    render(<ExportPanel {...defaultProps} onCopy={onCopy} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: /copy markdown export snippet to clipboard/i,
      })
    );

    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('applies disabled cursor styling when username is missing', () => {
    render(<ExportPanel {...defaultProps} hasUsername={false} />);

    const disabledButtons = screen
      .getAllByRole('button')
      .filter((button) => (button as HTMLButtonElement).disabled);

    expect(disabledButtons.length).toBeGreaterThan(0);

    disabledButtons.forEach((button) => {
      expect(button.className).toContain('cursor-not-allowed');
    });
  });

  it('disables download controls in action mode', () => {
    render(<ExportPanel {...defaultProps} format="action" />);

    const disabledButtons = screen
      .getAllByRole('button')
      .filter((button) => (button as HTMLButtonElement).disabled);

    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it('renders interactive buttons with hover transition classes', () => {
    render(<ExportPanel {...defaultProps} />);

    const copyButton = screen.getByRole('button', {
      name: /copy markdown export snippet to clipboard/i,
    });

    expect(copyButton.className).toContain('hover:bg-gray-300/80');
    expect(copyButton.className).toContain('hover:scale-[1.03]');
    expect(copyButton.className).toContain('active:scale-[0.97]');
  });
});
