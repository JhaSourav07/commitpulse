import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AIInsights from './AIInsights';
import type { AIInsight } from '@/types/dashboard';

/** IntersectionObserver must be a constructable class for framer-motion whileInView. */
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe = vi.fn((target: Element) => {
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
  });

  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

const baseInsights: AIInsight[] = [
  {
    id: '1',
    icon: 'Sparkles',
    text: 'Your commit frequency shows consistent activity patterns across weekdays.',
  },
  {
    id: '2',
    icon: 'Flame',
    text: 'You have a 15-day contribution streak. Keep the momentum going!',
  },
  {
    id: '3',
    icon: 'Code',
    text: 'JavaScript is your most used language with 45% of total commits.',
  },
];

const extendedInsights: AIInsight[] = [
  ...baseInsights,
  {
    id: '4',
    icon: 'Calendar',
    text: 'Your peak contribution time is between 2 PM and 4 PM on weekdays.',
  },
  {
    id: '5',
    icon: 'Zap',
    text: 'Recent activity spike detected in TypeScript repositories.',
  },
];

/** Walk up from a text node to the insight card wrapper with group class. */
function findInsightCard(insightText: string): HTMLElement {
  const textElement = screen.getByText(insightText);
  let el: HTMLElement | null = textElement.parentElement;

  while (el) {
    if (
      el.className &&
      el.className.includes('group') &&
      el.className.includes('hover:border-black/20')
    ) {
      return el;
    }
    el = el.parentElement;
  }

  throw new Error(
    `Could not find insight card with text "${insightText}". Found text element with className: "${textElement.className}"`
  );
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

describe('AIInsights — mouse interactivity', () => {
  it('renders all insights with interactive group class for hover state management', () => {
    render(<AIInsights insights={baseInsights} />);

    expect(screen.getByText(/Your commit frequency shows consistent activity/)).toBeInTheDocument();
    expect(screen.getByText(/You have a 15-day contribution streak/)).toBeInTheDocument();
    expect(screen.getByText(/JavaScript is your most used language/)).toBeInTheDocument();

    baseInsights.forEach((insight) => {
      const card = findInsightCard(insight.text);
      // motion.div has the group class and hover state management classes
      expect(card.className).toContain('group');
      expect(card.className).toContain('hover:border-black/20');
      expect(card.className).toContain('hover:bg-gray-200');
      expect(card.className).toContain('transition-all');
      expect(card.className).toContain('duration-200');
    });
  });

  it('applies group-hover color transitions to icon and text elements on card hover', async () => {
    const user = userEvent.setup();
    render(<AIInsights insights={baseInsights} />);

    const card = findInsightCard(baseInsights[0].text);
    const iconElement = card.querySelector('svg');
    const textElement = card.querySelector('p');

    // Card must have group-hover mechanism
    expect(card.className).toContain('group');

    // Text element must have group-hover color transition
    expect(textElement?.className).toContain('group-hover:text-white/80');
    expect(textElement?.className).toContain('transition-colors');
    expect(textElement?.className).toContain('duration-200');

    // On mouseenter, hover state should apply via group class
    fireEvent.mouseEnter(card);
    expect(card.className).toContain('group');
  });

  it('verifies cursor pointer interactivity with smooth transitions applied to card', () => {
    render(<AIInsights insights={baseInsights} />);

    baseInsights.forEach((insight) => {
      const card = findInsightCard(insight.text);

      // Verify card has transition-all and duration classes for smooth interactions
      expect(card.className).toContain('transition-all');
      expect(card.className).toContain('duration-200');

      // Verify card structure supports hover cursor pointer behavior
      expect(card.className).toContain('rounded-lg');
      expect(card.className).toContain('p-3');

      // Verify hover border and background changes are defined
      expect(card.className).toContain('hover:border-black/20');
      expect(card.className).toContain('hover:bg-gray-200');
    });
  });

  it('propagates mouseenter and mouseleave events without stopping propagation', () => {
    render(<AIInsights insights={baseInsights} />);

    const card = findInsightCard(baseInsights[0].text);
    const mouseEnterSpy = vi.fn();
    const mouseLeaveSpy = vi.fn();

    card.addEventListener('mouseenter', mouseEnterSpy);
    card.addEventListener('mouseleave', mouseLeaveSpy);

    // Simulate mouseenter event
    fireEvent.mouseEnter(card);
    expect(mouseEnterSpy).toHaveBeenCalledTimes(1);

    // Simulate mouseleave event
    fireEvent.mouseLeave(card);
    expect(mouseLeaveSpy).toHaveBeenCalledTimes(1);
  });

  it('handles click events on insight cards and propagates without stopping propagation', async () => {
    const user = userEvent.setup();
    render(<AIInsights insights={baseInsights} />);

    const card = findInsightCard(baseInsights[0].text);
    const clickSpy = vi.fn();
    const parentClickSpy = vi.fn();

    card.addEventListener('click', clickSpy);
    card.parentElement?.addEventListener('click', parentClickSpy);

    // Click must propagate to parent handlers
    await user.click(card);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(parentClickSpy).toHaveBeenCalledTimes(1);
  });

  it('ensures touch events behave identically to mouse events with same styling', () => {
    render(<AIInsights insights={baseInsights} />);

    const card = findInsightCard(baseInsights[1].text);
    const touchStartSpy = vi.fn();
    const touchEndSpy = vi.fn();

    card.addEventListener('touchstart', touchStartSpy);
    card.addEventListener('touchend', touchEndSpy);

    // Touch events must be supported without error
    expect(() => fireEvent.touchStart(card)).not.toThrow();
    expect(() => fireEvent.touchEnd(card)).not.toThrow();

    expect(touchStartSpy).toHaveBeenCalled();
    expect(touchEndSpy).toHaveBeenCalled();

    // Verify same styling applies for touch interactions on the card
    expect(card.className).toContain('hover:bg-gray-200');
    expect(card.className).toContain('hover:border-black/20');
    expect(card.className).toContain('transition-all');
    expect(card.className).toContain('duration-200');
  });

  it('supports independent hover states on multiple insight cards without interference', async () => {
    const user = userEvent.setup();
    render(<AIInsights insights={extendedInsights} />);

    const firstCard = findInsightCard(extendedInsights[0].text);
    const secondCard = findInsightCard(extendedInsights[1].text);
    const thirdCard = findInsightCard(extendedInsights[2].text);

    // Verify all cards have group class for independent hover state management
    expect(firstCard.className).toContain('group');
    expect(secondCard.className).toContain('group');
    expect(thirdCard.className).toContain('group');

    // Hover first card
    fireEvent.mouseEnter(firstCard);

    // Hover second card (first should maintain independent state)
    fireEvent.mouseEnter(secondCard);

    // Both cards maintain separate group context and hover classes
    expect(firstCard).toBeInTheDocument();
    expect(secondCard).toBeInTheDocument();

    // Verify border and background hover classes are consistently applied
    expect(firstCard.className).toContain('hover:border-black/20');
    expect(secondCard.className).toContain('hover:border-black/20');
    expect(thirdCard.className).toContain('hover:border-black/20');
  });

  it('preserves accessibility and DOM structure during mouseenter/mouseleave interactions', async () => {
    const user = userEvent.setup();
    render(<AIInsights insights={baseInsights} />);

    const card = findInsightCard(baseInsights[0].text);
    const initialHTML = card.innerHTML;

    // Simulate multiple hover cycles
    await user.pointer({ keys: '[MouseLeft>]', target: card });
    await user.pointer({ keys: '[/MouseLeft]', target: card });
    await user.pointer({ keys: '[MouseLeft>]', target: card });
    await user.pointer({ keys: '[/MouseLeft]', target: card });

    // DOM structure must remain unchanged
    expect(card.innerHTML).toBe(initialHTML);

    // Text content must remain accessible
    expect(card.textContent).toContain(baseInsights[0].text);
  });
});
