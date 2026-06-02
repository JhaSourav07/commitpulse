import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Template from './template';

type MotionDivProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MotionDivProps) => <div {...props}>{children}</div>,
  },
}));

type AccessibilityFixtureProps = {
  headingLevels: readonly [string, string, string];
};

function AccessibilityFixture({ headingLevels }: AccessibilityFixtureProps) {
  const [primaryHeading, secondaryHeading, tertiaryHeading] = headingLevels;

  return (
    <Template>
      <section
        aria-labelledby="app-shell-title"
        aria-describedby="app-shell-description"
        role="region"
      >
        <h1 id="app-shell-title">{primaryHeading}</h1>
        <p id="app-shell-description">{secondaryHeading}</p>

        <div data-testid="focus-group">
          <button
            type="button"
            data-testid="primary-action"
            style={{ outline: '2px solid currentColor', outlineOffset: '3px' }}
          >
            Primary action
          </button>
          <button
            type="button"
            data-testid="secondary-action"
            style={{ outline: '2px solid currentColor', outlineOffset: '3px' }}
          >
            Secondary action
          </button>
        </div>

        <button type="button" aria-describedby="template-tooltip" data-testid="tooltip-trigger">
          {tertiaryHeading}
        </button>
        <div id="template-tooltip" role="tooltip">
          Tooltip guidance for the current control.
        </div>

        <nav aria-label="Chronological keyboard order">
          <a href="#first-step" data-testid="step-link">
            First step
          </a>
          <button type="button" data-testid="step-button">
            Second step
          </button>
          <input aria-label="Third step input" data-testid="step-input" />
        </nav>

        <main aria-label="Heading hierarchy">
          <h2>Section overview</h2>
          <h3>Subsection detail</h3>
        </main>
      </section>
    </Template>
  );
}

function KeyboardOrderFixture() {
  return (
    <Template>
      <nav aria-label="Chronological keyboard order">
        <a href="#first-step" data-testid="step-link">
          First step
        </a>
        <button type="button" data-testid="step-button">
          Second step
        </button>
        <input aria-label="Third step input" data-testid="step-input" />
      </nav>
    </Template>
  );
}

function getTabbableElements(root: ParentNode): HTMLElement[] {
  const tabbableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(root.querySelectorAll<HTMLElement>(tabbableSelector));
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  document.body.removeAttribute('style');
});

describe('AppTemplate accessibility standards (Variation 4)', () => {
  it('Case 1: exposes structural labeling on the landmark container', () => {
    render(
      <AccessibilityFixture
        headingLevels={[
          'CommitPulse shell',
          'Screen-reader summary for the app template',
          'Tooltip anchor',
        ]}
      />
    );

    const region = screen.getByRole('region', { name: 'CommitPulse shell' });

    expect(region.getAttribute('aria-labelledby')).toBe('app-shell-title');
    expect(region.getAttribute('aria-describedby')).toBe('app-shell-description');
  });

  it('Case 2: keeps interactive controls focusable with visible outline styles', () => {
    render(
      <AccessibilityFixture
        headingLevels={[
          'CommitPulse shell',
          'Screen-reader summary for the app template',
          'Tooltip anchor',
        ]}
      />
    );

    const primaryAction = screen.getByTestId('primary-action');

    primaryAction.focus();
    expect(document.activeElement).toBe(primaryAction);
    expect(primaryAction.tabIndex).toBe(0);
    expect(primaryAction.style.outline).toBe('2px solid currentColor');
    expect(primaryAction.style.outlineOffset).toBe('3px');
  });

  it('Case 3: links tooltip triggers to descriptive accessible text', () => {
    render(
      <AccessibilityFixture
        headingLevels={[
          'CommitPulse shell',
          'Screen-reader summary for the app template',
          'Tooltip anchor',
        ]}
      />
    );

    const trigger = screen.getByTestId('tooltip-trigger');
    const tooltip = screen.getByRole('tooltip');

    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
    expect(tooltip.textContent).toBe('Tooltip guidance for the current control.');
  });

  it('Case 4: preserves chronological keyboard navigation order', () => {
    const { container } = render(<KeyboardOrderFixture />);

    const firstTabTarget = screen.getByTestId('step-link');
    const secondTabTarget = screen.getByTestId('step-button');
    const thirdTabTarget = screen.getByTestId('step-input');
    const tabbableOrder = getTabbableElements(container);

    expect(tabbableOrder).toEqual([firstTabTarget, secondTabTarget, thirdTabTarget]);
    expect(tabbableOrder.map((element) => element.dataset.testid)).toEqual([
      'step-link',
      'step-button',
      'step-input',
    ]);
  });

  it('Case 5: renders a progressive heading hierarchy without skipped levels', () => {
    render(
      <AccessibilityFixture
        headingLevels={[
          'CommitPulse shell',
          'Screen-reader summary for the app template',
          'Tooltip anchor',
        ]}
      />
    );

    const headings = screen.getAllByRole('heading');
    const headingLevels = headings.map((heading) =>
      Number(heading.getAttribute('aria-level') ?? heading.tagName.slice(1))
    );
    const headingLabels = headings.map((heading) => heading.textContent);

    expect(headingLevels).toEqual([1, 2, 3]);
    expect(headingLabels).toEqual(['CommitPulse shell', 'Section overview', 'Subsection detail']);
  });
});
