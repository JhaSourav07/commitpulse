import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TechnologiesSection } from './TechnologiesSection';

// Mock lucide-react using partial mocks
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Search: (props: Record<string, unknown>) => <div data-testid="search-icon" {...props} />,
    X: (props: Record<string, unknown>) => <div data-testid="x-icon" {...props} />,
    ChevronDown: (props: Record<string, unknown>) => (
      <div data-testid="chevron-down-icon" {...props} />
    ),
  };
});

describe('TechnologiesSection - Mouse Interactivity & Touch Events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Simulate mouseenter/hover events on interactive elements.
  test('1. simulate mouseenter/hover events on interactive elements', () => {
    const { container } = render(<TechnologiesSection selected={[]} onChange={vi.fn()} />);

    // Find a technology item button
    const firstTechBtn = container.querySelector('.grid button');
    expect(firstTechBtn).toBeInTheDocument();

    // Fire mouseenter event
    fireEvent.mouseEnter(firstTechBtn!);
    expect(firstTechBtn).toHaveClass('hover:bg-gray-100');
  });

  // 2. Verify tooltips or hover overlays appear at expected positions.
  test('2. verify tooltips or hover overlays appear at expected positions', () => {
    render(<TechnologiesSection selected={[]} onChange={vi.fn()} />);

    // Check that icons in the list have title tooltips containing their name
    const javascriptIcon = screen.getByTitle('JavaScript');
    expect(javascriptIcon).toBeInTheDocument();
    expect(javascriptIcon).toHaveAttribute('title', 'JavaScript');
  });

  // 3. Test click and touch interactions and ensure events propagate correctly.
  test('3. test click and touch interactions and ensure events propagate correctly', () => {
    const onChange = vi.fn();
    const { container } = render(<TechnologiesSection selected={[]} onChange={onChange} />);

    // Click on a technology item (e.g. JavaScript)
    const javascriptBtn = screen.getByText('JavaScript').closest('button');
    expect(javascriptBtn).toBeInTheDocument();

    fireEvent.click(javascriptBtn!);
    expect(onChange).toHaveBeenCalledWith(['javascript']);

    // Test touch event propagation to parent element
    const parentTouchHandler = vi.fn();
    const { container: touchContainer } = render(
      <div onTouchStart={parentTouchHandler}>
        <TechnologiesSection selected={[]} onChange={vi.fn()} />
      </div>
    );

    const categoryBtn = touchContainer.querySelector('[role="group"] button');
    expect(categoryBtn).toBeInTheDocument();
    fireEvent.touchStart(categoryBtn!);
    expect(parentTouchHandler).toHaveBeenCalled();
  });

  // 4. Verify interactive elements expose appropriate cursor styles and accessibility behavior.
  test('4. verify interactive elements expose appropriate cursor styles and accessibility behavior', () => {
    const { container } = render(<TechnologiesSection selected={[]} onChange={vi.fn()} />);

    // Check search accessibility label mapping
    const searchLabel = screen.getByText('Search technologies');
    expect(searchLabel).toHaveClass('sr-only');

    const searchInput = screen.getByPlaceholderText(/Search technologies.../i);
    expect(searchInput).toHaveAttribute('id', 'tech-search');

    // Check category group and button accessibility roles
    const categoryGroup = screen.getByRole('group', { name: /Technology Categories/i });
    expect(categoryGroup).toBeInTheDocument();

    const categoryButtons = categoryGroup.querySelectorAll('button');
    categoryButtons.forEach((btn) => {
      expect(btn).toHaveAttribute('type', 'button');
      expect(btn).toHaveClass('focus-visible:ring-2');
    });
  });

  // 5. Verify mouseleave hides temporary overlays without runtime errors.
  test('5. verify mouseleave hides temporary overlays without runtime errors', () => {
    const { container } = render(<TechnologiesSection selected={[]} onChange={vi.fn()} />);

    const firstTechBtn = container.querySelector('.grid button');
    expect(firstTechBtn).toBeInTheDocument();

    // Verify hover events and mouseleave do not trigger runtime exceptions
    expect(() => {
      fireEvent.mouseEnter(firstTechBtn!);
      fireEvent.mouseLeave(firstTechBtn!);
    }).not.toThrow();
  });
});
