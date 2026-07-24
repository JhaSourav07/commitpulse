import type { GeneratorState } from '../types';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PreviewPanel } from './PreviewPanel';
import React from 'react';

// Mock clipboard
vi.mock('@/utils/clipboard', () => ({
  fallbackCopyToClipboard: vi.fn().mockReturnValue(true),
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
}));

const mockState: GeneratorState = {
  name: '',
  description: '',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: 'test',
  showCommitPulse: false,
  commitPulseAccent: '',
  showRepoSpotlight: false,
  spotlightRepo: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
};

describe('PreviewPanel - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  const markdown = '# Hello\n\nResponsive Test';

  let originalWidth: number;

  beforeEach(() => {
    originalWidth = window.innerWidth;

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    window.dispatchEvent(new Event('resize'));
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth,
    });

    vi.restoreAllMocks();
  });

  it('1. mocks standard mobile-width media coordinates (375px)', () => {
    render(<PreviewPanel markdown={markdown} state={mockState} />);

    expect(window.innerWidth).toBe(375);

    expect(
      screen.getByRole('tablist', {
        name: /view mode selection/i,
      })
    ).toBeInTheDocument();
  });

  it('2. asserts layout reflows into vertical flex layout', () => {
    const { container } = render(<PreviewPanel markdown={markdown} state={mockState} />);

    const root = container.firstChild as HTMLElement;

    expect(root.className).toContain('flex');
    expect(root.className).toContain('flex-col');
    expect(root.className).toContain('overflow-hidden');
    expect(root.className).not.toContain('flex-row');
  });

  it('3. verifies no fixed widths causing horizontal scrollbar', () => {
    const { container } = render(<PreviewPanel markdown={markdown} state={mockState} />);

    const html = container.innerHTML;

    expect(html).not.toMatch(/w-\[\d+px\]/);
    expect(html).not.toContain('style="width:');
    expect(html).toContain('overflow-auto');
  });

  it('4. checks navigation/buttons scale correctly on mobile', () => {
    render(<PreviewPanel markdown={markdown} state={mockState} />);

    const downloadBtn = screen.getByTitle('Download README.md');

    expect(downloadBtn.className).toContain('px-3');
    expect(downloadBtn.className).toContain('py-1.5');

    // Mobile responsive label
    expect(downloadBtn.innerHTML).toContain('hidden');
    expect(downloadBtn.innerHTML).toContain('sm:inline');
  });

  it('5. asserts mobile tab toggle works correctly', () => {
    render(<PreviewPanel markdown={markdown} state={mockState} />);

    const previewTab = screen.getByRole('tab', {
      name: /preview/i,
    });

    const markdownTab = screen.getByRole('tab', {
      name: /markdown/i,
    });

    expect(previewTab).toHaveAttribute('aria-selected', 'true');
    expect(markdownTab).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(markdownTab);

    expect(previewTab).toHaveAttribute('aria-selected', 'false');
    expect(markdownTab).toHaveAttribute('aria-selected', 'true');

    expect(
      screen.getByRole('tabpanel', {
        name: /markdown/i,
      })
    ).toBeInTheDocument();
  });
});
