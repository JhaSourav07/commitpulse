import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PreviewPanel } from './PreviewPanel';
import React from 'react';

// Mock the clipboard utility to avoid triggering actual document operations
vi.mock('@/utils/clipboard', () => ({
  fallbackCopyToClipboard: vi.fn().mockReturnValue(true),
}));

describe('PreviewPanel Component Accessibility Tests', () => {
  const mockMarkdown = `# Main Title\n## Sub Section\n### Detail Item\n\nThis is a test markdown.`;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Test 1: ARIA Tab Roles & Selection
  it('1. verifies correct ARIA roles and dynamic aria-selected states for tabs and tab panels', () => {
    render(<PreviewPanel markdown={mockMarkdown} />);

    // 1. Tablist role
    const tablist = screen.getByRole('tablist', { name: /view mode selection/i });
    expect(tablist).toBeInTheDocument();

    // 2. Tab roles
    const previewTab = screen.getByRole('tab', { name: /preview/i });
    const markdownTab = screen.getByRole('tab', { name: /markdown/i });
    expect(previewTab).toBeInTheDocument();
    expect(markdownTab).toBeInTheDocument();

    // 3. Initial active tab and panel state
    expect(previewTab).toHaveAttribute('aria-selected', 'true');
    expect(markdownTab).toHaveAttribute('aria-selected', 'false');

    const previewPanel = screen.getByRole('tabpanel', { name: /preview/i });
    expect(previewPanel).toBeInTheDocument();
    expect(previewPanel).toHaveAttribute('id', 'panel-preview');
    expect(previewPanel).toHaveAttribute('aria-labelledby', 'tab-preview');

    // 4. Update tab selection and verify state changes
    fireEvent.click(markdownTab);
    expect(previewTab).toHaveAttribute('aria-selected', 'false');
    expect(markdownTab).toHaveAttribute('aria-selected', 'true');

    const markdownPanel = screen.getByRole('tabpanel', { name: /markdown/i });
    expect(markdownPanel).toBeInTheDocument();
    expect(markdownPanel).toHaveAttribute('id', 'panel-raw');
    expect(markdownPanel).toHaveAttribute('aria-labelledby', 'tab-raw');
  });

  // Test 2: Keyboard Accessibility
  it('2. verifies interactive elements are focusable and support keyboard interaction flow', () => {
    render(<PreviewPanel markdown={mockMarkdown} />);

    const previewTab = screen.getByRole('tab', { name: /preview/i });
    const markdownTab = screen.getByRole('tab', { name: /markdown/i });
    const downloadBtn = screen.getByRole('button', { name: /download/i });
    const copyBtn = screen.getByRole('button', { name: /copy/i });

    // Focus preview tab
    previewTab.focus();
    expect(document.activeElement).toBe(previewTab);

    // Focus markdown tab
    markdownTab.focus();
    expect(document.activeElement).toBe(markdownTab);

    // Focus download button
    downloadBtn.focus();
    expect(document.activeElement).toBe(downloadBtn);

    // Focus copy button
    copyBtn.focus();
    expect(document.activeElement).toBe(copyBtn);
  });

  // Test 3: Focus Outline Styling
  it('3. verifies that interactive controls possess correct focus-visible outline helper classes', () => {
    render(<PreviewPanel markdown={mockMarkdown} />);

    const previewTab = screen.getByRole('tab', { name: /preview/i });
    const markdownTab = screen.getByRole('tab', { name: /markdown/i });
    const downloadBtn = screen.getByRole('button', { name: /download/i });
    const copyBtn = screen.getByRole('button', { name: /copy/i });

    const expectedClasses = [
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-emerald-500',
      'focus-visible:ring-offset-2',
    ];

    expectedClasses.forEach((cls) => {
      expect(previewTab.className).toContain(cls);
      expect(markdownTab.className).toContain(cls);
      expect(downloadBtn.className).toContain(cls);
      expect(copyBtn.className).toContain(cls);
    });
  });

  // Test 4: Logical Heading Hierarchy
  it('4. verifies heading elements within generated preview HTML have a correct logical hierarchy and roles', () => {
    const { container } = render(<PreviewPanel markdown={mockMarkdown} />);

    // In preview mode, headings are rendered from markdown
    const h1 = container.querySelector('h1');
    const h2 = container.querySelector('h2');
    const h3 = container.querySelector('h3');

    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent('Main Title');
    expect(h1).toHaveClass('text-2xl', 'font-bold');

    expect(h2).toBeInTheDocument();
    expect(h2).toHaveTextContent('Sub Section');
    expect(h2).toHaveClass('text-xl', 'font-semibold');

    expect(h3).toBeInTheDocument();
    expect(h3).toHaveTextContent('Detail Item');
    expect(h3).toHaveClass('text-lg', 'font-medium');
  });

  // Test 5: Interactive Controls & Announcements
  it('5. verifies clipboard interactive controls, announcements, and download handler behaviors', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });

    // Mock anchor elements
    const anchorSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<PreviewPanel markdown={mockMarkdown} />);

    const copyBtn = screen.getByRole('button', { name: /copy/i });
    const downloadBtn = screen.getByRole('button', { name: /download/i });

    // Initial Copy state
    expect(copyBtn).toHaveAttribute('aria-label', 'Copy markdown text to clipboard');
    expect(copyBtn).toHaveAttribute('aria-live', 'polite');

    // Click copy button
    fireEvent.click(copyBtn);
    expect(mockWriteText).toHaveBeenCalledWith(mockMarkdown);

    // Microtask / state update resolution
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Check updated label and text
    expect(copyBtn).toHaveAttribute('aria-label', 'Copied markdown text to clipboard');
    expect(copyBtn).toHaveTextContent('Copied!');

    // Advance 2000ms
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Restores back to copy
    expect(copyBtn).toHaveAttribute('aria-label', 'Copy markdown text to clipboard');
    expect(copyBtn).toHaveTextContent('Copy');

    // Click Download button
    fireEvent.click(downloadBtn);
    expect(createUrlSpy).toHaveBeenCalled();
    expect(anchorSpy).toHaveBeenCalled();
    expect(revokeUrlSpy).toHaveBeenCalled();
  });
});
