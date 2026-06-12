// app/generator/components/SectionCard.accessibility.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SectionCard, FieldLabel } from './SectionCard';

describe('SectionCard Accessibility', () => {
  it('1. ARIA & Accessible Markup Validation: verifies interactive elements expose correct accessibility attributes', () => {
    // Arrange
    const titleText = 'Profile Details';
    const descText = 'Update your public profiles';
    const badgeCount = 5;

    render(
      <SectionCard title={titleText} icon="📝" description={descText} badge={badgeCount}>
        <div role="region" aria-label="Profile Form Fields">
          <FieldLabel>
            <label htmlFor="name-input" id="name-label">
              Full Name
            </label>
          </FieldLabel>
          <input id="name-input" aria-labelledby="name-label" aria-describedby="name-helper" />
          <p id="name-helper">Please use your professional name.</p>
        </div>
      </SectionCard>
    );

    // Verify the icon is rendered
    const icon = screen.getByText('📝');
    expect(icon).toBeInTheDocument();

    // Act & Assert
    // Verify the card toggle control is identified as a button and carries its title
    const toggleButton = screen.getByRole('button', { name: new RegExp(titleText, 'i') });
    expect(toggleButton).toBeInTheDocument();

    // Verify accessibility attributes on toggle button
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    const contentId = toggleButton.getAttribute('aria-controls');
    expect(contentId).toBeTruthy();

    const descriptionId = toggleButton.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();

    // Verify the description element exists and carries the correct ID
    const descElement = screen.getByText(descText);
    expect(descElement).toHaveAttribute('id', descriptionId!);

    // Verify the content region exists, carries the correct role, ID, and label
    const contentRegion = screen.getByRole('region', { name: new RegExp(titleText, 'i') });
    expect(contentRegion).toHaveAttribute('id', contentId!);
    expect(descElement.id).toBe(descriptionId);
    expect(contentRegion).toHaveAttribute('aria-labelledby', toggleButton.id);

    // Verify children containing fields using ARIA attributes map correctly
    const textInput = screen.getByRole('textbox', { name: 'Full Name' });
    expect(textInput).toBeInTheDocument();
    expect(textInput).toHaveAttribute('aria-describedby', 'name-helper');

    const helperText = screen.getByText('Please use your professional name.');
    expect(helperText).toBeInTheDocument();
  });

  it('2. Keyboard Focus Visibility: verifies focusable controls receive focus and focus indicators are preserved', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SectionCard title="Keyboard Focus Section" defaultOpen={true}>
        <button data-testid="test-action-button">Save Changes</button>
      </SectionCard>
    );

    const toggleButton = screen.getByRole('button', { name: /Keyboard Focus Section/i });
    const actionButton = screen.getByTestId('test-action-button');

    // Act & Assert
    // Tab 1: Toggle button should receive focus
    await user.tab();
    expect(toggleButton).toHaveFocus();

    // Ensure the toggle button carries the focus outline classes
    expect(toggleButton.className).toContain('focus-visible:ring-emerald-500/50');

    // Tab 2: Focus should transition to the inner interactive button
    await user.tab();
    expect(actionButton).toHaveFocus();

    // Tab 3: Focus moves out of the component scope
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it('3. Tooltip Accessibility: verifies tooltip trigger associates with content via ARIA attributes', () => {
    render(
      <SectionCard title="Tooltip Integration Section">
        <div>
          <button id="info-trigger" aria-describedby="info-tooltip">
            More Info
          </button>
          <div id="info-tooltip" role="tooltip">
            This explains the section settings in detail.
          </div>
        </div>
      </SectionCard>
    );

    const trigger = screen.getByRole('button', { name: 'More Info' });
    const tooltip = screen.getByRole('tooltip');

    // Assert
    expect(trigger).toHaveAttribute('aria-describedby', 'info-tooltip');
    expect(tooltip).toHaveTextContent('This explains the section settings in detail.');
  });

  it('4. Keyboard Navigation Order: verifies sequential keyboard navigation and that closed card controls are unreachable', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SectionCard title="Navigation Order Section" defaultOpen={true}>
        <input data-testid="field-1" />
        <input data-testid="field-2" />
      </SectionCard>
    );

    const toggleButton = screen.getByRole('button', { name: /Navigation Order Section/i });
    const field1 = screen.getByTestId('field-1');
    const field2 = screen.getByTestId('field-2');

    // Act & Assert (Open state)
    // 1. First tab to Card Toggle button
    await user.tab();
    expect(toggleButton).toHaveFocus();

    // 2. Second tab to Field 1
    await user.tab();
    expect(field1).toHaveFocus();

    // 3. Third tab to Field 2
    await user.tab();
    expect(field2).toHaveFocus();

    // 4. Fourth tab to exit
    await user.tab();
    expect(document.body).toHaveFocus();

    // Verify aria-expanded is true initially
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // Collapse the card by clicking the header button
    await user.click(toggleButton);

    // Verify aria-expanded is updated to false
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Verify children elements are unmounted from DOM
    expect(field1).not.toBeInTheDocument();
    expect(field2).not.toBeInTheDocument();

    // Focus on toggle button and tab once more to verify closed card contents are unreachable
    toggleButton.focus();
    expect(toggleButton).toHaveFocus();

    await user.tab();
    // Tab should immediately bypass inputs and return to body
    expect(document.body).toHaveFocus();
  });

  it('5. Heading Hierarchy Validation: verifies heading structure logical flow and checks for violations', () => {
    render(
      <SectionCard title="Card Title Content">
        <section>
          <h2>Primary Section Level 2 Heading</h2>
          <h3>Secondary Subsection Level 3 Heading</h3>
        </section>
      </SectionCard>
    );

    // Assert
    // Verify that the title of SectionCard is marked as an h3 heading
    const titleText = screen.getByText('Card Title Content');
    expect(titleText.tagName.toLowerCase()).toBe('h3');

    // Assert headings inside children preserve sequential structure
    const h2El = screen.getByRole('heading', { level: 2 });
    const h3El = screen.getByRole('heading', {
      level: 3,
      name: 'Secondary Subsection Level 3 Heading',
    });

    expect(h2El).toHaveTextContent('Primary Section Level 2 Heading');
    expect(h3El).toHaveTextContent('Secondary Subsection Level 3 Heading');
  });
});
