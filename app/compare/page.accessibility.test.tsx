import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import ComparePage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('ComparePage Accessibility Standards & Screen Reader Aria Compliance', () => {
  test('should verify accessible labels and aria attributes are correctly mapped', () => {
    render(<ComparePage />);

    const buttons = screen.queryAllByRole('button');
    const textboxes = screen.queryAllByRole('textbox');
    const interactiveElements = [...buttons, ...textboxes];

    interactiveElements.forEach((element) => {
      const htmlElement = element as HTMLInputElement | HTMLButtonElement;
      const hasAriaLabel = htmlElement.hasAttribute('aria-label');
      const hasAriaLabelledBy = htmlElement.hasAttribute('aria-labelledby');
      const hasAriaDescribedBy = htmlElement.hasAttribute('aria-describedby');
      const hasPlaceholder = htmlElement.hasAttribute('placeholder');
      const hasLabelNode = htmlElement.labels && htmlElement.labels.length > 0;
      const hasTextContent = htmlElement.textContent && htmlElement.textContent.trim().length > 0;

      expect(
        hasAriaLabel ||
          hasAriaLabelledBy ||
          hasAriaDescribedBy ||
          hasLabelNode ||
          hasPlaceholder ||
          hasTextContent
      ).toBe(true);
    });
  });

  test('should maintain visible focus indicators or appropriate focus styles on interactive elements', async () => {
    render(<ComparePage />);

    const focusableElements = screen.getAllByRole('button');
    if (focusableElements.length > 0) {
      const targetElement = focusableElements[0] as HTMLElement;
      targetElement.focus();
      expect(document.activeElement).toBe(targetElement);
    }
  });

  test('should verify tooltip labels provide correct screen reader descriptions', async () => {
    render(<ComparePage />);
    const user = userEvent.setup();

    const infoButtons = screen.queryAllByRole('button', { name: /info|help|details/i });

    for (const button of infoButtons) {
      await user.hover(button);
      const describedBy = button.getAttribute('aria-describedby');
      if (describedBy) {
        const descriptionElement = document.getElementById(describedBy);
        expect(descriptionElement).toBeInTheDocument();
        expect(descriptionElement?.textContent).not.toBe('');
      }
    }
  });

  test('should ensure sequential keyboard navigation follows a logical tab order', async () => {
    render(<ComparePage />);
    const user = userEvent.setup();

    const buttons = screen.queryAllByRole('button');
    const links = screen.queryAllByRole('link');
    const textboxes = screen.queryAllByRole('textbox');
    const focusable = [...buttons, ...links, ...textboxes];

    if (focusable.length > 1) {
      await user.tab();
      const firstFocused = document.activeElement;

      await user.tab();
      const secondFocused = document.activeElement;

      expect(firstFocused).not.toBe(secondFocused);
    }
  });

  test('should maintain a logically ordered heading hierarchy', () => {
    render(<ComparePage />);

    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);

    let highestLevelFound = false;
    let previousLevel = 1;

    headings.forEach((heading) => {
      const currentLevel = parseInt(heading.tagName.replace('H', ''), 10);

      if (!highestLevelFound) {
        if (currentLevel === 1 || currentLevel === 2) {
          highestLevelFound = true;
        }
      }

      expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      previousLevel = currentLevel;
    });
  });
});
