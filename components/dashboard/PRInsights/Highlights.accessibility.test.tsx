import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Highlights from './Highlights';

vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a: ({ children, className, href, target, rel, ...props }: any) => {
      const validProps = Object.keys(props).reduce(
        (acc, key) => {
          if (!['initial', 'animate', 'transition'].includes(key)) {
            acc[key] = props[key as keyof typeof props];
          }
          return acc;
        },
        {} as Record<string, unknown>
      );

      return (
        <a href={href} target={target} rel={rel} className={className} {...validProps}>
          {children}
        </a>
      );
    },
  },
}));

describe('Highlights Accessibility Standards & Screen Reader Aria Compliance', () => {
  const mockHighlights = {
    fastestMerged: {
      title: 'Improve dashboard loading',
      url: 'https://github.com/test/repo/pull/1',
      time: 2.5,
    },
    mostDiscussed: {
      title: 'Refactor analytics module',
      url: 'https://github.com/test/repo/pull/2',
      comments: 12,
    },
    largest: {
      title: 'Add performance insights',
      url: 'https://github.com/test/repo/pull/3',
      additions: 450,
      deletions: 120,
    },
  };

  it('inspects markup for accessible link roles and descriptive text labels', () => {
    render(<Highlights highlights={mockHighlights} />);

    expect(screen.getByRole('link', { name: /fastest merged pr/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /most discussed/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /largest impact/i })).toBeInTheDocument();
  });

  it('asserts focusable PR highlight links can receive keyboard focus', () => {
    render(<Highlights highlights={mockHighlights} />);

    const fastestLink = screen.getByRole('link', { name: /fastest merged pr/i });
    fastestLink.focus();

    expect(fastestLink).toHaveFocus();
  });

  it('verifies tooltip-like descriptions are announced through visible descriptive content', () => {
    render(<Highlights highlights={mockHighlights} />);

    expect(screen.getByText('Improve dashboard loading')).toBeInTheDocument();
    expect(screen.getByText('Refactor analytics module')).toBeInTheDocument();
    expect(screen.getByText('Add performance insights')).toBeInTheDocument();
  });

  it('tests keyboard tab order across highlight cards', async () => {
    render(<Highlights highlights={mockHighlights} />);

    const user = userEvent.setup();
    const links = screen.getAllByRole('link');

    await user.tab();
    expect(links[0]).toHaveFocus();

    await user.tab();
    expect(links[1]).toHaveFocus();

    await user.tab();
    expect(links[2]).toHaveFocus();
  });

  it('confirms heading hierarchy uses card titles as logical level 3 headings', () => {
    render(<Highlights highlights={mockHighlights} />);

    const headings = screen.getAllByRole('heading', { level: 3 });

    expect(headings).toHaveLength(3);
    expect(headings[0]).toHaveTextContent('Fastest Merged PR');
    expect(headings[1]).toHaveTextContent('Most Discussed');
    expect(headings[2]).toHaveTextContent('Largest Impact');
  });
});
