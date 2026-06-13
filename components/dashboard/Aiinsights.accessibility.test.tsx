import { HTMLAttributes, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AIInsights from './AIInsights';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.insights.title': 'AI Insights',
      };
      return translations[key] ?? key;
    },
  }),
}));

const mockInsights = [
  { id: '1', icon: 'Zap', text: 'You commit most frequently on Tuesdays.' },
  { id: '2', icon: 'Moon', text: 'Your peak coding hours are between 10pm and midnight.' },
  { id: '3', icon: 'Flame', text: 'You have a 5-day commit streak this week.' },
];

describe('AIInsights – Accessibility Standards & Screen Reader ARIA Compliance', () => {
  it('renders a heading with correct accessible text for screen readers', () => {
    render(<AIInsights insights={mockInsights} />);

    const heading = screen.getByRole('heading', { level: 3, name: 'AI Insights' });
    expect(heading).toBeInTheDocument();
  });

  it('exposes insight text as accessible content readable by screen readers', () => {
    render(<AIInsights insights={mockInsights} />);

    mockInsights.forEach((insight) => {
      expect(screen.getByText(insight.text)).toBeInTheDocument();
    });
  });

  it('renders insight items in source order for correct tab navigation', () => {
    render(<AIInsights insights={mockInsights} />);

    // Collect only <p> elements whose text matches an insight, preserving DOM order
    const paragraphs = screen
      .getAllByText(/.*/, { selector: 'p' })
      .filter((p) => mockInsights.some((insight) => p.textContent === insight.text));

    expect(paragraphs).toHaveLength(mockInsights.length);
    paragraphs.forEach((p, i) => {
      expect(p).toHaveTextContent(mockInsights[i].text);
    });
  });

  it('section container has no interactive role that could mislead assistive technologies', () => {
    render(<AIInsights insights={mockInsights} />);

    // Walk up from the heading to the outermost wrapping div (the motion.div root)
    const heading = screen.getByRole('heading', { level: 3, name: 'AI Insights' });
    const sectionRoot = heading.closest('div')?.closest('div') as HTMLElement;

    expect(sectionRoot).toBeInTheDocument();
    expect(sectionRoot.getAttribute('role')).toBeNull();
    expect(sectionRoot.getAttribute('tabindex')).toBeNull();
  });

  it('insight text nodes are not hidden from the accessibility tree', () => {
    render(<AIInsights insights={mockInsights} />);

    mockInsights.forEach((insight) => {
      const textNode = screen.getByText(insight.text);

      expect(textNode).not.toHaveAttribute('aria-hidden', 'true');

      // Walk every ancestor up to <body> — aria-hidden="true" on any parent
      // suppresses the entire subtree from screen readers
      let ancestor = textNode.parentElement;
      while (ancestor && ancestor.tagName !== 'BODY') {
        expect(ancestor).not.toHaveAttribute('aria-hidden', 'true');
        ancestor = ancestor.parentElement;
      }
    });
  });
});
