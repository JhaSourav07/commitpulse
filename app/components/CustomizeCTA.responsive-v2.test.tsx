import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomizeCTA } from './CustomizeCTA';

const { mockMotionDiv, mockLink } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');

  const mockMotionDiv = React.forwardRef(
    (props: React.HTMLAttributes<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) =>
      React.createElement('div', { ref, ...props })
  );
  mockMotionDiv.displayName = 'mockMotionDiv';

  const mockLink = React.forwardRef(
    (
      props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string },
      ref: React.Ref<HTMLAnchorElement>
    ) => React.createElement('a', { ref, ...props })
  );
  mockLink.displayName = 'mockLink';

  return { mockMotionDiv, mockLink };
});

// Mock framer-motion to simplify layout rendering and inspect attributes
vi.mock('framer-motion', () => ({
  motion: {
    div: mockMotionDiv,
  },
}));

// Mock next/link to simplify anchor expectations
vi.mock('next/link', () => ({
  default: mockLink,
}));

describe('CustomizeCTA — responsive rendering and elements (Variation 2)', () => {
  it('applies the correct responsive spacing and layout bounds to the main container', () => {
    const { container } = render(<CustomizeCTA />);

    const mainContainer = container.querySelector('#customization-studio');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('max-w-4xl', 'mx-auto', 'mb-16');
  });

  it('toggles flex layout directions between column on mobile and row on desktop viewports', () => {
    const { container } = render(<CustomizeCTA />);

    const flexContainer = container.querySelector('.relative.z-10');
    expect(flexContainer).toBeInTheDocument();
    expect(flexContainer).toHaveClass('flex', 'flex-col', 'md:flex-row');
  });

  it('aligns text content centrally on mobile and shifts to left alignment on desktop', () => {
    const { container } = render(<CustomizeCTA />);

    const textWrapper = container.querySelector('.flex-1');
    expect(textWrapper).toBeInTheDocument();
    expect(textWrapper).toHaveClass('text-center', 'md:text-left');
  });

  it('renders the section header using responsive font sizes from mobile text-2xl to desktop md:text-3xl', () => {
    render(<CustomizeCTA />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('text-2xl', 'md:text-3xl');
  });

  it('adjusts CTA button horizontal padding size responsively between mobile px-4 and desktop md:px-7', () => {
    const { container } = render(<CustomizeCTA />);

    const buttonSpan = container.querySelector('[class*="px-4"]');
    expect(buttonSpan).toBeInTheDocument();
    expect(buttonSpan).toHaveClass('px-4', 'md:px-7');
  });
});
