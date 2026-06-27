import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { CommitPulseLogo } from './commitpulse-logo';

describe('CommitPulseLogo responsive breakpoints', () => {
  it('renders the default compact mobile-safe logo size', () => {
    const { container } = render(<CommitPulseLogo />);
    const logo = container.querySelector('svg');

    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass('h-5');
    expect(logo).toHaveClass('w-5');
  });

  it('accepts responsive width and height classes for mobile-to-desktop scaling', () => {
    const { container } = render(
      <CommitPulseLogo className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
    );
    const logo = container.querySelector('svg');

    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass('h-6');
    expect(logo).toHaveClass('w-6');
    expect(logo).toHaveClass('sm:h-7');
    expect(logo).toHaveClass('sm:w-7');
    expect(logo).toHaveClass('md:h-8');
    expect(logo).toHaveClass('md:w-8');
  });

  it('keeps scalable svg viewport dimensions for responsive rendering', () => {
    const { container } = render(<CommitPulseLogo />);
    const logo = container.querySelector('svg');

    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('viewBox', '0 0 24 24');
    expect(logo).not.toHaveAttribute('width');
    expect(logo).not.toHaveAttribute('height');
  });

  it('avoids absolute layout classes that can cause mobile overflow', () => {
    const { container } = render(<CommitPulseLogo className="h-5 w-5 shrink-0" />);
    const logo = container.querySelector('svg');

    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass('shrink-0');
    expect(logo).not.toHaveClass('min-w-screen');
    expect(logo).not.toHaveClass('w-screen');
    expect(logo).not.toHaveClass('fixed');
  });

  it('preserves decorative accessibility while scaling across viewports', () => {
    const { container } = render(<CommitPulseLogo className="h-5 w-5 sm:h-6 sm:w-6" />);
    const logo = container.querySelector('svg');

    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('aria-hidden', 'true');
    expect(logo).toHaveClass('sm:h-6');
    expect(logo).toHaveClass('sm:w-6');
  });
});
