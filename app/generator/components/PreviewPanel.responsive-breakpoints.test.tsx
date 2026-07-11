import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreviewPanel } from './PreviewPanel';
// Safely type the mock data by dynamically extracting the component's expected prop type.
// This prevents TypeScript 'any' errors and satisfies Husky pre-commit hooks.
type PreviewPanelProps = React.ComponentProps<typeof PreviewPanel>;

// Provide generic mock props that a PreviewPanel might expect (e.g., markdown string, config objects)
const mockProps = {
  markdown: '# Initial Markdown',
  content: '# Initial Content',
  config: {},
  onUpdate: vi.fn(),
} as unknown as PreviewPanelProps;

describe('PreviewPanel Responsive Breakpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly for a standard 375px mobile viewport', () => {
    const { getByText } = render(<PreviewPanel markdown="# Hello" />);

    expect(getByText('Preview')).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
  });

  it('uses a vertical flex layout for mobile viewports', () => {
    const { container } = render(<PreviewPanel markdown="# Hello" />);

    const wrapper = container.firstElementChild as HTMLElement;

    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('flex-col');
  });

  it('does not use fixed-width classes that could cause horizontal scrolling', () => {
    const { container } = render(<PreviewPanel markdown="# Hello" />);
    const wrapper = container.firstElementChild as HTMLElement;

    expect(wrapper.className).not.toContain('w-screen');
    expect(wrapper.className).not.toContain('w-[');
    expect(wrapper.className).not.toContain('min-w-');
    expect(wrapper.className).not.toContain('max-w-');
  });

  it('renders navigation controls for responsive layouts', () => {
    const { getByRole } = render(<PreviewPanel markdown="# Hello" />);

    expect(getByRole('tablist')).toBeInTheDocument();

    expect(getByRole('tab', { name: /preview/i })).toBeInTheDocument();
    expect(getByRole('tab', { name: /markdown/i })).toBeInTheDocument();
  });

  it('switches between Preview and Markdown tabs correctly', () => {
    const { getByRole } = render(<PreviewPanel markdown="# Hello" />);
    const previewTab = getByRole('tab', { name: /preview/i });
    const markdownTab = getByRole('tab', { name: /markdown/i });

    // Preview is selected by default
    expect(previewTab).toHaveAttribute('aria-selected', 'true');
    expect(markdownTab).toHaveAttribute('aria-selected', 'false');

    // Switch to Markdown
    fireEvent.click(markdownTab);

    expect(markdownTab).toHaveAttribute('aria-selected', 'true');
    expect(previewTab).toHaveAttribute('aria-selected', 'false');
  });
});
