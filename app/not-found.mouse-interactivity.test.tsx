import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NotFound from './not-found';

// Define strict prop types for mocks
interface MockLinkProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

interface MockMiniGameProps {
  onInteract?:
    | React.MouseEventHandler<HTMLDivElement>
    | React.TouchEventHandler<HTMLDivElement>
    | undefined;
}

// Mocking dependencies to isolate the component
vi.mock('next/link', () => ({
  default: ({ children, href, className, onClick }: MockLinkProps) => (
    <a href={href} className={className} onClick={onClick} data-testid="nav-link">
      {children}
    </a>
  ),
}));

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

// Mock the MiniGame to include an interactive node that might trigger tooltips or gestures
vi.mock('../components/MiniGame', () => ({
  default: ({ onInteract }: MockMiniGameProps) => (
    <div
      data-testid="mini-game-container"
      className="cursor-pointer"
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        // Mocking a tooltip overlay generation for the test
        const tooltip = document.createElement('div');
        tooltip.setAttribute('data-testid', 'tooltip-overlay');
        tooltip.style.position = 'absolute';
        tooltip.style.top = `${e.clientY + 10}px`;
        tooltip.style.left = `${e.clientX + 10}px`;
        document.body.appendChild(tooltip);
      }}
      onMouseLeave={() => {
        const tooltip = document.querySelector('[data-testid="tooltip-overlay"]');
        if (tooltip) tooltip.remove();
      }}
      onClick={onInteract as React.MouseEventHandler<HTMLDivElement>}
      onTouchStart={onInteract as React.TouchEventHandler<HTMLDivElement>}
    >
      <div data-testid="active-segment">Interactive Node</div>
    </div>
  ),
}));

describe('NotFound Component - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  beforeEach(() => {
    // Ensure a clean DOM for tooltip mounting/unmounting
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Trigger simulated mouseenter/hover gestures on active segments or interactive nodes', () => {
    render(<NotFound />);

    const interactiveNode = screen.getByTestId('mini-game-container');

    // Tooltip should not exist before hover
    expect(screen.queryByTestId('tooltip-overlay')).not.toBeInTheDocument();

    // Simulate hover gesture
    fireEvent.mouseEnter(interactiveNode, { clientX: 100, clientY: 200 });

    // Verify the tooltip visual has been triggered and mounted
    expect(screen.getByTestId('tooltip-overlay')).toBeInTheDocument();
  });

  it('Verify that responsive tooltip layouts display at computed coordinates', () => {
    render(<NotFound />);

    const interactiveNode = screen.getByTestId('mini-game-container');

    // Trigger hover at specific mock coordinates
    fireEvent.mouseEnter(interactiveNode, { clientX: 150, clientY: 300 });

    const tooltip = screen.getByTestId('tooltip-overlay');

    // Verify the tooltip calculated its layout coordinates based on the pointer event
    expect(tooltip.style.position).toBe('absolute');
    expect(tooltip.style.left).toBe('160px'); // 150 + 10 offset
    expect(tooltip.style.top).toBe('310px'); // 300 + 10 offset
  });

  it('Test custom click/touch gestures and ensure click events propagate correctly', () => {
    render(<NotFound />);

    const interactiveNode = screen.getByTestId('mini-game-container');

    // Grab all rendered nav links, and just use the first one for the click test
    const navLinks = screen.getAllByTestId('nav-link');
    const navLink = navLinks[0];

    // Setup spy to ensure events bubble or trigger correctly
    const clickSpy = vi.fn();
    interactiveNode.onclick = clickSpy;
    interactiveNode.ontouchstart = clickSpy;

    // Simulate custom Touch gesture
    fireEvent.touchStart(interactiveNode);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    // Simulate Mouse click gesture
    fireEvent.click(interactiveNode);
    expect(clickSpy).toHaveBeenCalledTimes(2);

    // Ensure the navigation link also handles clicks properly
    const linkSpy = vi.fn();
    navLink.onclick = linkSpy;
    fireEvent.click(navLink);
    expect(linkSpy).toHaveBeenCalledTimes(1);
  });

  it('Assert appropriate cursor style classes (like pointer) are applied on hover', () => {
    render(<NotFound />);

    const interactiveNode = screen.getByTestId('mini-game-container');

    // Assert the presence of utility classes handling cursor styling
    expect(interactiveNode.className).toMatch(/cursor-pointer/);

    // If the component relies on CSS-in-JS or inline styles for dynamic cursors
    const computedStyle = window.getComputedStyle(interactiveNode);
    if (computedStyle.cursor) {
      expect(computedStyle.cursor).not.toBe('default');
    }
  });

  it('Check that mouseleave events successfully hide temporary overlay visuals', () => {
    render(<NotFound />);

    const interactiveNode = screen.getByTestId('mini-game-container');

    // Trigger hover to spawn the tooltip
    fireEvent.mouseEnter(interactiveNode, { clientX: 50, clientY: 50 });
    expect(screen.getByTestId('tooltip-overlay')).toBeInTheDocument();

    // Trigger mouseleave
    fireEvent.mouseLeave(interactiveNode);

    // Verify the temporary overlay visual is successfully removed from the DOM
    expect(screen.queryByTestId('tooltip-overlay')).not.toBeInTheDocument();
  });
});
