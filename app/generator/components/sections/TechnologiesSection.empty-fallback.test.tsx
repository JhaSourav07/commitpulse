import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TechnologiesSection } from './TechnologiesSection';
import '@testing-library/jest-dom/vitest';
import React from 'react';

describe('TechnologiesSection Component - Empty Fallback Tests', () => {
  const defaultProps = {
    selected: [],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Case 1: Render the component with empty arrays and verify that a clear, non-breaking fallback UI is displayed', () => {
    render(<TechnologiesSection {...defaultProps} />);

    // Under an empty state, the "Selected" section header and items should not render
    expect(screen.queryByText(/Selected \(/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Clear all/i)).not.toBeInTheDocument();

    // The component should still render the main header and description
    expect(screen.getByText('Technologies')).toBeInTheDocument();
    expect(screen.getByText(/Select your tech stack/i)).toBeInTheDocument();
  });

  it('Case 2: Pass null parameters for selected list and verify no crashes occur', () => {
    expect(() => {
      render(
        <TechnologiesSection
          selected={null as unknown as string[]}
          onChange={defaultProps.onChange}
        />
      );
    }).not.toThrow();

    // Verify main components are present even with null parameter
    expect(screen.getByText('Technologies')).toBeInTheDocument();
    expect(screen.queryByText(/Selected \(/i)).not.toBeInTheDocument();
  });

  it('Case 3: Verify standard structural CSS styles or container class names are maintained even when in its default empty layout state', () => {
    render(<TechnologiesSection {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search technologies...');
    expect(searchInput).toHaveClass('w-full', 'rounded-xl', 'border', 'pl-9');

    const mainContainer = screen.getByText('Technologies').closest('#technologies-section');
    expect(mainContainer).toBeInTheDocument();
  });

  it('Case 4: Assert that no unexpected runtime errors occur when interacting with the component when callback is missing or undefined', async () => {
    // Render without onChange callback
    render(
      <TechnologiesSection
        selected={[]}
        onChange={undefined as unknown as (ids: string[]) => void}
      />
    );

    const categoryButtons = screen.getAllByRole('button');
    const firstCategory = categoryButtons[0];

    // Clicking category buttons should not throw
    expect(() => {
      fireEvent.click(firstCategory);
    }).not.toThrow();

    // Clicking a technology list item should not throw even if onChange is undefined
    const techButton = screen
      .getAllByRole('button')
      .find((btn) => btn.className.includes('w-full') && btn.className.includes('rounded-xl'));
    if (techButton) {
      expect(() => {
        fireEvent.click(techButton);
      }).not.toThrow();
    }
  });

  it('Case 5: Check key DOM structures to make sure empty markers exist', () => {
    render(<TechnologiesSection {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search technologies...');

    // Type a string that matches no technology
    fireEvent.change(searchInput, {
      target: { value: 'nonexistenttechnologyname12345' },
    });

    // Check that the empty marker text is displayed
    const emptyMarker = screen.getByText('No technologies match your search');
    expect(emptyMarker).toBeInTheDocument();
    expect(emptyMarker).toHaveClass('py-8', 'text-center', 'text-sm', 'text-gray-400');
  });
});
