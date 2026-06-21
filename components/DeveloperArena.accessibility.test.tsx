/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import DeveloperArena from './DeveloperArena';
import React from 'react';

// Mock Next.js Image component (same approach as DeveloperArena.test.tsx)
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// jsdom doesn't ship IntersectionObserver; CountUp falls back to its
// resolved value without it, which is fine for these tests, but we provide
// a real mock here so behaviour matches a browser that does support it.
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Embeds the widget in a fixture page so we can check it doesn't disturb the
// surrounding document's heading hierarchy or tab order.
const renderInFixturePage = () => {
  const handleSelectBattle = vi.fn();
  const utils = render(
    <>
      <a href="#content">Skip to content</a>
      <main id="content">
        <h1>Dashboard</h1>
        <button type="button" data-testid="before">
          Before
        </button>
        <DeveloperArena onSelectBattle={handleSelectBattle} />
        <button type="button" data-testid="after">
          After
        </button>
      </main>
    </>
  );
  return { ...utils, handleSelectBattle };
};

describe('DeveloperArena Accessibility', () => {
  it('gives every rendered image a non-empty accessible name', () => {
    const { container } = render(<DeveloperArena onSelectBattle={vi.fn()} />);

    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);

    images.forEach((img) => {
      expect(img.getAttribute('alt')).toBeTruthy();
    });
  });

  it('exposes the primary action buttons with descriptive accessible names', () => {
    render(<DeveloperArena onSelectBattle={vi.fn()} />);

    expect(screen.getByRole('button', { name: /reveal developer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^skip$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start predicted battle/i })).toBeInTheDocument();
  });

  it('gives the icon-only "next prediction" button an accessible name via aria-label', () => {
    render(<DeveloperArena onSelectBattle={vi.fn()} />);

    const nextPredictionButton = screen.getByRole('button', { name: /next prediction/i });
    expect(nextPredictionButton).toHaveAccessibleName('Next Prediction');
    expect(nextPredictionButton).toHaveAttribute('aria-label', 'Next Prediction');
  });

  it('reveals an accessible "Challenge Linus!" button after the reveal action', async () => {
    const user = userEvent.setup();
    render(<DeveloperArena onSelectBattle={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /challenge linus/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reveal developer/i }));

    expect(await screen.findByRole('button', { name: /challenge linus/i })).toBeInTheDocument();
  });

  it('does not pull the mouse-driven showdown/legend marquee cards into the tab order', async () => {
    const user = userEvent.setup();
    const { container } = renderInFixturePage();

    // The marquee cards are plain clickable divs with no tabindex/role, so
    // they should never receive focus via Tab.
    const marqueeCards = container.querySelectorAll('.marquee-track-showdowns > div');
    expect(marqueeCards.length).toBeGreaterThan(0);
    marqueeCards.forEach((card) => expect(card).not.toHaveAttribute('tabindex'));

    await user.tab(); // skip link
    await user.tab(); // "before" button
    expect(screen.getByTestId('before')).toHaveFocus();

    // Tab moves straight from "before" into the first real interactive
    // control inside DeveloperArena (the Reveal Developer button) — never
    // landing on a showdown or legend card.
    await user.tab();
    expect(screen.getByRole('button', { name: /reveal developer/i })).toHaveFocus();
  });

  it('keeps a logical, non-skipping heading hierarchy under a page-level h1', () => {
    renderInFixturePage();

    const headings = screen
      .getAllByRole('heading')
      .map((heading) => Number(heading.tagName.slice(1)));

    for (let i = 1; i < headings.length; i++) {
      expect(headings[i] - headings[i - 1]).toBeLessThanOrEqual(1);
    }
    expect(headings[0]).toBe(1);
  });

  it('has no broken aria-labelledby or aria-describedby references', () => {
    renderInFixturePage();

    const missingIds: string[] = [];
    document.querySelectorAll('[aria-labelledby], [aria-describedby]').forEach((el) => {
      ['aria-labelledby', 'aria-describedby'].forEach((attr) => {
        const value = el.getAttribute(attr);
        if (!value) return;
        value
          .split(/\s+/)
          .filter(Boolean)
          .forEach((id) => {
            if (!document.getElementById(id)) missingIds.push(id);
          });
      });
    });

    expect(missingIds).toEqual([]);
  });

  it('does not introduce duplicate element ids when rendered more than once', () => {
    render(
      <>
        <DeveloperArena onSelectBattle={vi.fn()} />
        <DeveloperArena onSelectBattle={vi.fn()} />
      </>
    );

    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.getAttribute('id'));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('does not disturb surrounding tab order or focus when embedded in a page', async () => {
    const user = userEvent.setup();
    renderInFixturePage();

    await user.tab();
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByTestId('before')).toHaveFocus();
  });

  it('scopes the trivia-game reveal heading to its own panel, not duplicated app-wide', async () => {
    const user = userEvent.setup();
    render(<DeveloperArena onSelectBattle={vi.fn()} />);

    // "Dan Abramov" also appears in the legends marquee, so scope the check
    // to the actual "Guess The Developer" panel rather than matching by name.
    const panelHeading = screen.getByRole('heading', { name: 'Guess The Developer' });
    // h3 -> "flex items-center gap-2" -> "flex justify-between ... mb-6" header row -> the panel div itself
    const panel = panelHeading.parentElement!.parentElement!.parentElement!;

    expect(within(panel).queryByRole('heading', { level: 4 })).not.toBeInTheDocument();

    await user.click(within(panel).getByRole('button', { name: /reveal developer/i }));

    expect(await within(panel).findByRole('heading', { level: 4 })).toHaveTextContent(
      'Dan Abramov'
    );
    expect(within(panel).getByRole('button', { name: /challenge linus/i })).toBeInTheDocument();
  });
});
