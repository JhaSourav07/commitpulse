import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotFound from './not-found';

// Mock sonner toast to avoid side effects
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: { writeText: vi.fn() },
});

describe('NotFound page — accessibility', () => {
  beforeEach(() => {
    render(<NotFound />);
  });

  it('exposes accessible names on all interactive elements', () => {
    const links = screen.getAllByRole('link');

    // Two links: external "git checkout main" and internal "Go back home"
    expect(links).toHaveLength(2);

    // Both links have visible text that serves as their accessible name
    const checkoutLink = screen.getByRole('link', { name: 'git checkout main' });
    expect(checkoutLink).toBeInTheDocument();
    expect(checkoutLink).toHaveAttribute('href', 'https://github.com/JhaSourav07/commitpulse');

    const homeLink = screen.getByRole('link', { name: 'Go back home' });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('ensures all interactive controls are keyboard focusable', async () => {
    const user = userEvent.setup();

    // Only the two links are focusable (the terminal div is not keyboard-reachable)
    const checkoutLink = screen.getByRole('link', { name: 'git checkout main' });
    const homeLink = screen.getByRole('link', { name: 'Go back home' });

    // Tab should focus the first link
    await user.tab();
    expect(document.activeElement).toBe(checkoutLink);

    // Tab again should focus the second link
    await user.tab();
    expect(document.activeElement).toBe(homeLink);
  });

  it('validates no broken ARIA ID references exist', () => {
    // The page has no elements with aria-describedby or aria-labelledby,
    // so there are no cross-reference IDs to validate.
    const elementsWithDescribedBy = document.querySelectorAll('[aria-describedby]');
    const elementsWithLabelledBy = document.querySelectorAll('[aria-labelledby]');

    elementsWithDescribedBy.forEach((el) => {
      const ids = el.getAttribute('aria-describedby')!.split(/\s+/);
      ids.forEach((id) => {
        expect(document.getElementById(id)).toBeInTheDocument();
      });
    });

    elementsWithLabelledBy.forEach((el) => {
      const ids = el.getAttribute('aria-labelledby')!.split(/\s+/);
      ids.forEach((id) => {
        expect(document.getElementById(id)).toBeInTheDocument();
      });
    });

    // Assert the page is clean — no dangling references
    expect(elementsWithDescribedBy.length).toBe(0);
    expect(elementsWithLabelledBy.length).toBe(0);
  });

  it('contains a single top-level heading exposed to assistive technology', () => {
    const headings = screen.getAllByRole('heading');

    // The page has exactly one h1
    expect(headings).toHaveLength(1);

    const heading = headings[0];
    expect(heading.tagName).toBe('H1');
    expect(heading).toHaveTextContent(/Looks like this commit got/i);
  });

  it('has a logical tab order matching the rendered reading order', async () => {
    const user = userEvent.setup();

    // The two links appear in source order:
    // 1. "git checkout main" (external GitHub link)
    // 2. "Go back home" (internal link)

    const checkoutLink = screen.getByRole('link', { name: 'git checkout main' });
    const homeLink = screen.getByRole('link', { name: 'Go back home' });

    // Tab to first link
    await user.tab();
    expect(document.activeElement).toBe(checkoutLink);

    // Tab to second link
    await user.tab();
    expect(document.activeElement).toBe(homeLink);

    // Tab again — no focus trap; focus should leave the page content
    await user.tab();
    expect(document.activeElement).not.toBe(checkoutLink);
    expect(document.activeElement).not.toBe(homeLink);
  });
});
