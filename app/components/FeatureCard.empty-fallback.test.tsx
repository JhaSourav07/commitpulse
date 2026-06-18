import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { FeatureCard } from './FeatureCard';

// Mock framer-motion's motion.div with a plain div.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const cleanProps = { ...props };
      delete cleanProps.whileHover;
      delete cleanProps.whileTap;
      delete cleanProps.whileInView;
      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.exit;
      delete cleanProps.transition;
      delete cleanProps.viewport;
      return <div {...cleanProps}>{children}</div>;
    },
  },
}));

type FeatureCardProps = ComponentProps<typeof FeatureCard>;

describe('FeatureCard - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('renders successfully with empty parameter fields and handles empty/null icon', () => {
    expect(() => render(<FeatureCard icon={null} title="" desc="" accent="" />)).not.toThrow();

    // Verify it renders the structure article card with empty text tags
    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('');

    const paragraph = article.querySelector('p');
    expect(paragraph).toBeInTheDocument();
    expect(paragraph?.textContent).toBe('');
  });

  it('renders successfully when props are omitted or undefined', () => {
    expect(() => render(<FeatureCard {...({} as unknown as FeatureCardProps)} />)).not.toThrow();

    // Default parameters prevent replace lookup errors
    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('renders successfully when props are null', () => {
    expect(() =>
      render(
        <FeatureCard
          icon={null}
          title={null as unknown as string}
          desc={null as unknown as string}
          accent={null as unknown as string}
        />
      )
    ).not.toThrow();

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
  });

  it('preserves standard visual layout styles in default empty fallback configurations', () => {
    const { container } = render(<FeatureCard icon={null} title="" desc="" accent="" />);

    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv).toBeInTheDocument();

    // Standard card presentation styles
    expect(cardDiv).toHaveClass('p-10');
    expect(cardDiv).toHaveClass('bg-[#0f0f0f]');
    expect(cardDiv).toHaveClass('border-white/5');
    expect(cardDiv).toHaveClass('rounded-4xl');
  });

  it('sanitizes special characters in title and constructs matching accessibility targets', () => {
    const titleWithSpecialChars = 'Feature   Card  !!!   123';
    render(
      <FeatureCard icon={null} title={titleWithSpecialChars} desc="Descriptive details" accent="" />
    );

    // Verify sanitized title id format matching: feature-title-feature-card-!!!-123
    const heading = screen.getByRole('heading', { level: 3 });
    const paragraph = screen.getByRole('article').querySelector('p');

    expect(heading).toHaveAttribute('id', 'feature-title-feature-card-!!!-123');
    expect(paragraph).toHaveAttribute('id', 'feature-desc-feature-card-!!!-123');

    // Confirm that the parent article points to these accessibility targets
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-labelledby', 'feature-title-feature-card-!!!-123');
    expect(article).toHaveAttribute('aria-describedby', 'feature-desc-feature-card-!!!-123');
  });
});
