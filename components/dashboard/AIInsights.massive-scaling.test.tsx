import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AIInsights from './AIInsights';
import type { HTMLAttributes } from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('AIInsights - Massive Scaling', () => {
  const hugeInsightsList = Array.from({ length: 5000 }, (_, i) => ({
    id: `insight-${i}`,
    icon: ['Moon', 'Sun', 'Zap', 'Calendar', 'Flame', 'Code', 'Star'][i % 7],
    text: `Insight number ${i}: contributor performed ${i * 100} actions across ${i + 1} repositories during the last sprint cycle.`,
  }));

  it('renders successfully with thousands of insight records', () => {
    const { container } = render(<AIInsights insights={hugeInsightsList} />);

    expect(container.firstChild).toBeInTheDocument();
    // Verify the outer wrapper is present and is a div (no layout crash)
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('renders all insight text nodes without dropping entries', () => {
    const sampleInsights = Array.from({ length: 500 }, (_, i) => ({
      id: `insight-${i}`,
      icon: 'Zap',
      text: `Activity log entry ${i}`,
    }));

    render(<AIInsights insights={sampleInsights} />);

    // Spot-check first, middle and last entries to confirm no truncation in the DOM
    expect(screen.getByText('Activity log entry 0')).toBeInTheDocument();
    expect(screen.getByText('Activity log entry 249')).toBeInTheDocument();
    expect(screen.getByText('Activity log entry 499')).toBeInTheDocument();
  });

  it('handles insights with extremely long text without breaking layout', () => {
    const longTextInsights = Array.from({ length: 100 }, (_, i) => ({
      id: `long-${i}`,
      icon: 'Code',
      text: 'A'.repeat(10000) + ` entry ${i}`,
    }));

    const { container } = render(<AIInsights insights={longTextInsights} />);

    // All paragraph nodes must be present — no buffer overflow / silent drop
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(100);

    // Each paragraph must carry the correct entry suffix so text is not silently truncated
    expect(paragraphs[0].textContent).toContain('entry 0');
    expect(paragraphs[99].textContent).toContain('entry 99');
  });

  it('maps every known icon key to a rendered element without falling back unexpectedly', () => {
    const iconKeys = ['Moon', 'Sun', 'Zap', 'Calendar', 'Flame', 'Code', 'Star'];
    const iconInsights = iconKeys.map((icon, i) => ({
      id: `icon-test-${i}`,
      icon,
      text: `Icon test for ${icon}`,
    }));

    const { container } = render(<AIInsights insights={iconInsights} />);

    // Each insight card must be rendered — one flex row per insight
    const cards = container.querySelectorAll('div.group');
    expect(cards.length).toBe(iconKeys.length);

    // All label texts must be visible
    iconKeys.forEach((icon) => {
      expect(screen.getByText(`Icon test for ${icon}`)).toBeInTheDocument();
    });
  });

  it('renders within acceptable execution time for a large input set', () => {
    const start = performance.now();

    render(<AIInsights insights={hugeInsightsList} />);

    const elapsed = performance.now() - start;

    // Must complete in under 5 seconds even for 5 000 items
    expect(elapsed).toBeLessThan(5000);
  });
});
