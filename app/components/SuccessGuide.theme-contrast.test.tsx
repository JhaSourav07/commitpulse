import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SuccessGuide } from './SuccessGuide';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./Icons', () => ({
  CloseIcon: () => <svg data-testid="close-icon" />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: React.ComponentProps<'div'>) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

describe('SuccessGuide Theme Contrast', () => {
  const props = {
    markdown: '[CommitPulse](https://commitpulse.io)',
    onDismiss: vi.fn(),
  };

  it('renders dark theme background styles correctly', () => {
    render(<SuccessGuide {...props} />);

    const region = screen.getByRole('region');

    expect(region.className).toContain('bg-[#050505]/80');
    expect(region.className).toContain('border-emerald-500/20');
    expect(region.className).toContain('backdrop-blur-2xl');
  });

  it('renders readable high-contrast heading text', () => {
    render(<SuccessGuide {...props} />);

    const heading = screen.getByRole('heading');

    expect(heading.className).toContain('text-white');
    expect(heading.className).toContain('font-extrabold');
  });

  it('renders emerald accent colors for visual cohesion', () => {
    render(<SuccessGuide {...props} />);

    const codeSnippet = screen.getByLabelText('Your badge markdown snippet');

    expect(codeSnippet.className).toContain('text-emerald-300');

    const copiedLabel = screen.getByText('success_guide.markdown_copied');

    expect(copiedLabel.className).toContain('text-emerald-400');
  });

  it('renders interactive dismiss button with visible hover contrast styles', () => {
    render(<SuccessGuide {...props} />);

    const dismissButton = screen.getByRole('button', {
      name: /dismiss guide/i,
    });

    expect(dismissButton.className).toContain('hover:text-white');

    expect(dismissButton.className).toContain('hover:bg-white/5');
  });

  it('renders overlay glow without hiding foreground content', () => {
    render(<SuccessGuide {...props} />);

    const overlay = document.querySelector('.blur-\\[80px\\]');

    expect(overlay).toBeTruthy();

    const snippet = screen.getByLabelText('Your badge markdown snippet');

    expect(snippet).toBeVisible();
  });
});
