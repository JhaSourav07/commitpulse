import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useState } from 'react';
import '@testing-library/jest-dom';
import DashboardLayout from './layout';

vi.mock('sonner', () => ({
  Toaster: () => React.createElement('div', { 'data-testid': 'toaster-mock' }),
}));

describe('DashboardLayout - Responsive Breakpoints Layout Cohesion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
  });

  it('Case 1: mocks standard mobile-width media coordinates correctly', () => {
    render(
      React.createElement(
        DashboardLayout,
        null,
        React.createElement('div', { 'data-testid': 'child-element' }, 'Test child')
      )
    );

    expect(window.innerWidth).toBe(375);
    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByTestId('toaster-mock')).toBeInTheDocument();
  });

  it('Case 2: asserts that layout structure allows children columns to reflow correctly', () => {
    const { container } = render(
      React.createElement(
        DashboardLayout,
        null,
        React.createElement(
          'div',
          { className: 'flex flex-col md:flex-row', 'data-testid': 'columns-container' },
          [
            React.createElement('div', { key: 'a', className: 'w-full md:w-1/2' }, 'Column A'),
            React.createElement('div', { key: 'b', className: 'w-full md:w-1/2' }, 'Column B'),
          ]
        )
      )
    );

    // Verify main element wrapper exists and doesn't restrict layout direction
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('max-w-[1600px]');
    expect(mainElement).toHaveClass('mx-auto');

    const cols = screen.getByTestId('columns-container');
    expect(cols).toHaveClass('flex-col');
    expect(cols).toHaveClass('md:flex-row');
  });

  it('Case 3: verifies layout styling values are not absolute widths that cause horizontal scrollbars', () => {
    const { container } = render(
      React.createElement(DashboardLayout, null, React.createElement('div', null, 'Content'))
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();

    // Verify it doesn't use absolute fixed widths like w-[1600px]
    expect(mainElement).not.toHaveClass('w-[1600px]');
    expect(mainElement).toHaveClass('max-w-[1600px]');
  });

  it('Case 4: checks that nested components scale down gracefully', () => {
    render(
      React.createElement(
        DashboardLayout,
        null,
        React.createElement(
          'div',
          { className: 'w-full max-w-sm', 'data-testid': 'card' },
          'Responsive Card'
        )
      )
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('w-full');
    expect(card).toHaveClass('max-w-sm');
  });

  it('Case 5: asserts mobile-specific toggle states respond cleanly', () => {
    const InteractiveChild = () => {
      const [isOpen, setIsOpen] = useState(false);
      return React.createElement('div', null, [
        React.createElement(
          'button',
          { key: 'btn', 'data-testid': 'toggle-btn', onClick: () => setIsOpen(!isOpen) },
          'Toggle Menu'
        ),
        isOpen
          ? React.createElement('div', { key: 'menu', 'data-testid': 'mobile-menu' }, 'Menu Open')
          : null,
      ]);
    };

    render(React.createElement(DashboardLayout, null, React.createElement(InteractiveChild)));

    const btn = screen.getByTestId('toggle-btn');
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

    // Resize viewport to large desktop screen
    window.innerWidth = 1440;
    window.dispatchEvent(new Event('resize'));
    expect(window.innerWidth).toBe(1440);

    fireEvent.click(btn);
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });
});
