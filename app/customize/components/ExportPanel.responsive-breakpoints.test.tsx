import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { ExportFormat } from '../types';
import { ExportPanel } from './ExportPanel';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
  }),
}));

const baseProps = {
  format: 'markdown' as ExportFormat,
  snippet: '[CommitPulse](https://commitpulse.vercel.app/api/badge?u=octocat)',
  copied: false,
  copyStatusMessage: '',
  hasUsername: true,
  username: 'octocat',
  onFormatChange: vi.fn(),
  onCopy: vi.fn(),
};

describe('ExportPanel responsive layout classes', () => {
  it('format-toggle button group wraps on narrow screens and collapses to a single row from sm: up', () => {
    const { container } = render(<ExportPanel {...baseProps} />);

    const formatGroup = container.querySelector('[aria-label="Export format"]');
    expect(formatGroup).toBeInTheDocument();
    expect(formatGroup).toHaveClass('flex-wrap');
    expect(formatGroup).toHaveClass('sm:flex-nowrap');
  });

  it('header actions container stacks vertically by default and only becomes a horizontal row at the sm: breakpoint', () => {
    const { container } = render(<ExportPanel {...baseProps} />);

    const headerRow = container.querySelector('.flex.flex-col.gap-4.sm\\:flex-row');
    expect(headerRow).toBeInTheDocument();
    expect(headerRow).toHaveClass('flex-col');
    expect(headerRow).toHaveClass('sm:flex-row');
    expect(headerRow).toHaveClass('sm:items-center');
    expect(headerRow).toHaveClass('sm:justify-between');
  });

  it('no rendered element carries a hardcoded fixed-pixel width that would force horizontal scrolling on a 375px viewport', () => {
    const { container } = render(<ExportPanel {...baseProps} />);

    const fixedPixelWidthPattern = /\bw-\[\d+px\]/;
    expect(container.innerHTML).not.toMatch(fixedPixelWidthPattern);
  });

  it('renders identical markup regardless of window.innerWidth, confirming layout is CSS-driven (Tailwind breakpoints) and not dependent on JS viewport detection', () => {
    const { container: desktopContainer, unmount } = render(<ExportPanel {...baseProps} />);
    const desktopHtml = desktopContainer.innerHTML;
    unmount();

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    const { container: mobileContainer } = render(<ExportPanel {...baseProps} />);
    expect(mobileContainer.innerHTML).toBe(desktopHtml);
  });
});
