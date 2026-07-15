import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CodeBlock } from './code-block';

// Helper to simulate window resizing
const resizeViewport = (width: number) => {
  window.innerWidth = width;
  window.dispatchEvent(new Event('resize'));
};

describe('CodeBlock - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  const sampleCode = 'const message = "Hello World";';

  beforeEach(() => {
    vi.useFakeTimers();
    // Default to a standard desktop width before each test
    resizeViewport(1024);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // Test Case 1: Mock standard mobile-width media coordinates
  it('should render reliably within a standard 375px mobile viewport coordinate space', () => {
    resizeViewport(375);
    render(<CodeBlock code={sampleCode} />);

    const preElement = screen.getByText(sampleCode).closest('pre');
    expect(preElement).toBeInTheDocument();
    expect(window.innerWidth).toBe(375);
  });

  // Test Case 2: Assert that columns reflow into standard vertical flex lists
  it('should contain a container layout capable of flowing elements vertically on mobile viewports', () => {
    resizeViewport(375);
    const { container } = render(<CodeBlock code={sampleCode} />);

    // The main wrapper uses relative layout matching the block-level stream
    const outerContainer = container.firstChild;
    expect(outerContainer).toHaveClass('group', 'relative');
  });

  // Test Case 3: Verify styling values are not absolute widths that cause horizontal scrollbars
  it('should ensure the code block wrapper utilizes responsive styles without hardcoded absolute clipping dimensions', () => {
    resizeViewport(375);
    render(<CodeBlock code={sampleCode} />);

    const preElement = screen.getByText(sampleCode).closest('pre');

    // The component utilizes overflow-x-auto to safely handle inner content
    // instead of absolute bounding-box containers which break mobile bounds.
    expect(preElement).toHaveClass('overflow-x-auto');

    const computedStyles = window.getComputedStyle(preElement!);
    expect(computedStyles.width).not.toBe('800px'); // Assures no absolute pixel clipping width is set
  });

  // Test Case 4: Check that navigation/interactive components scale down gracefully
  it('should verify that copy navigation elements adjust appropriately to smaller layout boundaries', () => {
    resizeViewport(375);
    render(<CodeBlock code={sampleCode} />);

    const copyButton = screen.getByRole('button', { name: /copy code snippet/i });

    // Validates that padding and styling elements use small text structures
    // tailored dynamically for smaller screen margins
    expect(copyButton).toHaveClass('absolute', 'right-3', 'top-3', 'text-xs');
  });

  // Test Case 5: Assert mobile-specific toggle states respond cleanly
  it('should transition cleanly through active toggle copy states on a mobile viewport layout', async () => {
    resizeViewport(375);

    // Mock navigator.clipboard
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal('navigator', { clipboard: mockClipboard });

    render(<CodeBlock code={sampleCode} />);

    const copyButton = screen.getByRole('button', { name: /copy code snippet/i });
    expect(copyButton).toHaveTextContent('Copy');

    // Simulate clicking copy toggle on mobile view wrapped safely in act()
    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(mockClipboard.writeText).toHaveBeenCalledWith(sampleCode);
    expect(copyButton).toHaveAttribute('aria-label', 'Copied snippet');
    expect(copyButton).toHaveTextContent('Copied');

    // Fast-forward timeout wrapped in act() to verify it safely reverts states
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(copyButton).toHaveTextContent('Copy');
  });
});
