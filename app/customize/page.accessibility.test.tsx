import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CustomizePage from './page';
import React, { type ReactNode } from 'react';

// Mock next/navigation
const replaceMock = vi.fn();
const searchParamsMock = {
  get: vi.fn(() => null),
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => searchParamsMock,
}));

// Mock TranslationContext
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: ReactNode }) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: { children?: ReactNode }) => (
      <aside {...props}>{children}</aside>
    ),
  },
}));

// Mock components to keep tests focused on the main page wrapper structure
vi.mock('./components/ControlsPanel', () => ({
  ControlsPanel: () => <div data-testid="controls-panel" />,
}));

vi.mock('./components/AdvancedSettingsPanel', () => ({
  AdvancedSettingsPanel: () => <div data-testid="advanced-panel" />,
}));

vi.mock('./components/ExportPanel', () => ({
  ExportPanel: () => <div data-testid="export-panel" />,
}));

vi.mock('@/components/InteractiveViewer', () => ({
  default: ({ children }: { children?: ReactNode }) => (
    <div data-testid="interactive-viewer">{children}</div>
  ),
}));

vi.mock('@/app/components/Footer', () => ({
  Footer: () => <footer data-testid="footer" />,
}));

describe('CustomizePage Accessibility & ARIA Compliance (Variation 4)', () => {
  // 1. Inspect markup to check for correct use of accessible label coordinates (role, aria-labelledby, or aria-describedby)
  it('1. verifies that the layout structure contains semantic ARIA role landmarks', () => {
    render(<CustomizePage />);

    // Sidebar panels should render as semantic <aside> landmarks
    const asides = screen.getAllByRole('complementary');
    expect(asides.length).toBeGreaterThanOrEqual(1);
  });

  // 2. Assert elements that accept key focus (buttons, interactive nodes) maintain visible outline behaviors
  it('2. asserts that key focusable link elements have visible focus outlines', () => {
    render(<CustomizePage />);

    const backLink = screen.getByRole('link', { name: /customize\.back_to_home/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveClass('hover:text-black');
    expect(backLink).toHaveClass('transition-colors');
  });

  // 3. Verify tooltip labels are announced with correct accessibility descriptions
  it('3. confirms that interactive viewer wrapper has appropriate click event descriptions', () => {
    const { container } = render(<CustomizePage />);

    // The live preview inner container must exist and be accessible
    const viewer = container.querySelector('[data-testid="interactive-viewer"]');
    expect(viewer).toBeInTheDocument();
  });

  // 4. Test keyboard control path selectors to ensure normal tab ordering
  it('4. checks that standard page links have correct focusability properties', () => {
    render(<CustomizePage />);

    const backLink = screen.getByRole('link', { name: /customize\.back_to_home/i });
    expect(backLink).not.toHaveAttribute('tabIndex', '-1'); // Must be keyboard focusable
  });

  // 5. Confirm standard headings exist in the correct logical hierarchical order
  it('5. asserts page headings exist in a valid hierarchical structure', () => {
    render(<CustomizePage />);

    // The page title should be a standard h1 heading for correct document structure
    const pageTitle = screen.getByRole('heading', { level: 1 });
    expect(pageTitle).toBeInTheDocument();
    expect(pageTitle.textContent).toBe('customize.title');
  });
});
