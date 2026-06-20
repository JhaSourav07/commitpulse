import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { SuccessGuide } from './SuccessGuide';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        return ({
          children,
          animate,
          initial,
          exit,
          transition,
          whileHover,
          whileTap,
          whileFocus,
          ...props
        }: {
          children?: React.ReactNode;
          [key: string]: unknown;
        }) => React.createElement(tag as string, props, children);
      },
    }
  ),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./Icons', () => ({
  CloseIcon: () => <svg data-testid="close-icon" />,
}));

function renderGuide(markdown = '[![badge](https://example.com/badge.svg)](https://example.com)') {
  return render(<SuccessGuide markdown={markdown} onDismiss={vi.fn()} />);
}

describe('SuccessGuide - Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  it('renders the same fixed dark-themed markup regardless of the active color-scheme preference', () => {
    // Emulate a dual theme environment: render once under each preset
    const matchMediaMock = (matches: boolean) =>
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('dark') ? matches : !matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

    window.matchMedia = matchMediaMock(true) as unknown as typeof window.matchMedia;
    const { container: darkContainer } = renderGuide();
    const darkMarkup = darkContainer.innerHTML;

    window.matchMedia = matchMediaMock(false) as unknown as typeof window.matchMedia;
    const { container: lightContainer } = renderGuide();
    const lightMarkup = lightContainer.innerHTML;

    // Component has no dark:/light: variants — markup must be identical under both presets
    expect(darkMarkup).toBe(lightMarkup);
  });

  it('applies sufficient contrast text classes against the dark background for all textual elements', () => {
    renderGuide();

    // Heading and label text must use high-contrast white/emerald classes, not low-contrast tones
    const heading = screen.getByText('success_guide.title');
    expect(heading).toHaveClass('text-white');

    const badge = screen.getByText('success_guide.markdown_copied');
    expect(badge).toHaveClass('text-emerald-400');

    const stepTitle = screen.getByText('success_guide.step_1_title');
    expect(stepTitle).toHaveClass('text-white');

    const stepBody = screen.getByText('success_guide.step_1_body');
    expect(stepBody).toHaveClass('text-gray-500');
  });

  it('keeps the markdown snippet code element on a high-contrast emerald-on-black foreground', () => {
    renderGuide('[![badge](https://example.com/a.svg)](https://example.com)');

    const codeEl = screen.getByLabelText('Your badge markdown snippet');
    expect(codeEl.tagName).toBe('CODE');
    expect(codeEl).toHaveClass('text-emerald-300');

    const snippetWrapper = codeEl.parentElement;
    expect(snippetWrapper).toHaveClass('bg-black/60');
  });

  it('confirms the decorative background glow overlay is non-interactive and does not clip foreground text', () => {
    const { container } = renderGuide();

    const glowOverlay = container.querySelector('[aria-hidden="true"].blur-\\[80px\\]');
    expect(glowOverlay).toBeInTheDocument();
    expect(glowOverlay).toHaveClass('pointer-events-none');

    // Foreground heading text must still be present and rendered after the overlay in the DOM
    expect(screen.getByText('success_guide.title')).toBeVisible();
  });

  it('renders the root card with the expected translucent backdrop and border styling classes intact', () => {
    const { container } = renderGuide();

    const card = container.querySelector('[role="region"]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-[#050505]/80');
    expect(card).toHaveClass('backdrop-blur-2xl');
    expect(card).toHaveClass('border-emerald-500/20');
  });
});
