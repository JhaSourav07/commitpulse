import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PreviewPanel } from './PreviewPanel';
import React from 'react';

// Mock the clipboard utility to avoid triggering actual document operations
vi.mock('@/utils/clipboard', () => ({
  fallbackCopyToClipboard: vi.fn().mockReturnValue(true),
}));

describe('PreviewPanel Component Interactivity Tests', () => {
  const mockMarkdown = '# Hello World\n\nThis is a test markdown string.';

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Case 1: Interactive Pointer Detection (Cursor Hovers Equivalent)
  it('Case 1: applies transition and hover styles structurally on all interactive controls', () => {
    render(<PreviewPanel markdown={mockMarkdown} />);

    const previewTab = screen.getByRole('button', { name: /preview/i });
    const rawTab = screen.getByRole('button', { name: /markdown/i });
    const downloadBtn = screen.getByTitle('Download README.md');
    const copyBtn = screen.getByRole('button', { name: /copy/i });

    // Tabs should use transition-colors
    expect(previewTab.className).toContain('transition-colors');
    expect(rawTab.className).toContain('transition-colors');

    // Action buttons should use transitions
    expect(downloadBtn.className).toContain('transition-colors');
    expect(copyBtn.className).toContain('transition-all');

    // Inactive tabs and action buttons must specify hover style classes
    expect(rawTab.className).toContain('hover:text-gray-700');
    expect(downloadBtn.className).toContain('hover:bg-gray-100');
    expect(copyBtn.className).toContain('hover:bg-emerald-400');
  });

  // Case 2: Hover State Visibility (Tooltips Equivalent)
  it('Case 2: implements native tooltips and styles active tab states correctly', () => {
    render(<PreviewPanel markdown={mockMarkdown} />);

    const downloadBtn = screen.getByTitle('Download README.md');
    expect(downloadBtn).toHaveAttribute('title', 'Download README.md');

    const previewTab = screen.getByRole('button', { name: /preview/i });
    expect(previewTab.className).toContain('bg-white');
  });

  // Case 3: Event Propagation to DOM Targets (Touch Propagation Equivalent)
  it('Case 3: click events propagate cleanly to parental DOM wrappers', () => {
    const parentClickSpy = vi.fn();
    render(
      <div onClick={parentClickSpy} data-testid="outer-wrapper">
        <PreviewPanel markdown={mockMarkdown} />
      </div>
    );

    const downloadBtn = screen.getByTitle('Download README.md');
    const copyBtn = screen.getByRole('button', { name: /copy/i });

    // Mock anchor element clicks triggered by download handler to prevent navigation errors
    const anchorSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    // Click Download button
    fireEvent.click(downloadBtn);
    expect(parentClickSpy).toHaveBeenCalledTimes(1);
    expect(anchorSpy).toHaveBeenCalled();

    // Click Copy button
    fireEvent.click(copyBtn);
    expect(parentClickSpy).toHaveBeenCalledTimes(2);

    anchorSpy.mockRestore();
    createUrlSpy.mockRestore();
    revokeUrlSpy.mockRestore();
  });

  // Case 4: Mouse Leave Recovery (Hiding Overlay visuals Equivalent)
  it('Case 4: transitions copy button label states and resets safely after delay', async () => {
    // Mock navigator.clipboard
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

    render(<PreviewPanel markdown={mockMarkdown} />);

    const copyBtn = screen.getByRole('button', { name: /copy/i });
    expect(copyBtn).toHaveTextContent('Copy');

    // Click copy button
    fireEvent.click(copyBtn);
    expect(mockWriteText).toHaveBeenCalledWith(mockMarkdown);

    // Microtask resolution
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Label should switch to "Copied!"
    expect(copyBtn).toHaveTextContent('Copied!');

    // Advance 2000ms to recover
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Reset back to normal
    expect(copyBtn).toHaveTextContent('Copy');
  });

  // Case 5: Touch and Mobile Interactivity
  it('Case 5: mobile touch gestures propagate successfully on controls', () => {
    const parentTouchSpy = vi.fn();
    render(
      <div onTouchStart={parentTouchSpy} data-testid="outer-wrapper">
        <PreviewPanel markdown={mockMarkdown} />
      </div>
    );

    const downloadBtn = screen.getByTitle('Download README.md');

    // Simulate mobile touchstart gesture
    const touchStartRes = fireEvent.touchStart(downloadBtn);
    expect(touchStartRes).toBe(true);
    expect(parentTouchSpy).toHaveBeenCalledTimes(1);
  });
});
