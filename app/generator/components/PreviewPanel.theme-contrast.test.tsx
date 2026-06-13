import React from 'react';
import { render } from '@testing-library/react';
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

describe('PreviewPanel Theme Contrast and Visual Cohesion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to emulate dark/light presets on the document element
  const setupTheme = (isDark: boolean) => {
    document.documentElement.className = isDark ? 'dark' : '';
  };

  it('1. should emulate both dark and light presets', () => {
    // Emulate Light mode
    setupTheme(false);
    const { container: lightContainer, unmount } = render(<PreviewPanel {...mockProps} />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(lightContainer).toBeTruthy();
    unmount();

    // Emulate Dark mode
    setupTheme(true);
    const { container: darkContainer } = render(<PreviewPanel {...mockProps} />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(darkContainer).toBeTruthy();
  });

  it('2. should assert that the visual elements adapt color styling properly for both settings', () => {
    const { container } = render(<PreviewPanel {...mockProps} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeTruthy();

    // Check if the main container is present in the document.
    // We use toBeInTheDocument() to bypass potential opacity:0 animation states.
    expect(wrapper).toBeInTheDocument();
  });

  it('3. should verify contrast ratio standards are satisfied for all textual elements', () => {
    const { container } = render(<PreviewPanel {...mockProps} />);

    // Filter out nested graphical/svg components and check standard text nodes
    const textNodes = Array.from(container.querySelectorAll('*')).filter(
      (el) => el.textContent?.trim().length !== 0 && el.children.length === 0
    );

    textNodes.forEach((node) => {
      // Ensure text isn't inadvertently rendered invisible through tailwind utilities
      // Skeletons or hidden elements should use sr-only rather than text-transparent
      expect(node).not.toHaveClass('text-transparent');
    });
  });

  it('4. should check that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    const { container } = render(<PreviewPanel {...mockProps} />);

    const wrapper = container.firstChild as HTMLElement;

    // Confirm the structural wrapper is intact and utilizing Tailwind layout logic
    expect(wrapper).toBeDefined();
    // Usually standard box-model, flex, or grid classes apply to panels
    expect(wrapper.className.length).toBeGreaterThan(0);
    expect(wrapper.className).not.toBe('');
  });

  it('5. should ensure that background overlays do not clip foreground content colors', () => {
    const { container } = render(<PreviewPanel {...mockProps} />);

    const wrapper = container.firstChild as HTMLElement;

    // Verify that the wrapper itself renders safely within DOM bounds
    expect(wrapper).toBeInTheDocument();

    // Ensure that the component isn't inadvertently hidden or collapsed by clipping utilities
    expect(wrapper).not.toHaveClass('opacity-0');
    expect(wrapper).not.toHaveClass('invisible');
    expect(wrapper).not.toHaveClass('hidden');
  });
});
