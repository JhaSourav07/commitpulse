import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { TechnologyGraph } from './TechnologyGraph';

describe('TechnologyGraph Responsive Breakpoints', () => {
  const defaultProps = {
    selected: [],
    onToggle: vi.fn(),
  };

  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original window width
    window.innerWidth = originalInnerWidth;
    fireEvent(window, new Event('resize'));
    cleanup();
  });

  it('1. mocks standard mobile-width media coordinates (e.g. 375px wide viewports)', () => {
    // Mock mobile viewport width
    window.innerWidth = 375;
    fireEvent(window, new Event('resize'));

    render(<TechnologyGraph {...defaultProps} />);

    expect(window.innerWidth).toBe(375);
    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();
  });

  it('2. asserts that columns reflow into standard vertical flex lists on mobile viewports', () => {
    // Mock mobile viewport width
    window.innerWidth = 375;
    fireEvent(window, new Event('resize'));

    render(<TechnologyGraph {...defaultProps} />);

    // The heading and toolbar container should reflow to flex-col on mobile
    const heading = screen.getByText('Technology Dependency Graph');
    const headingContainer = heading.closest('h3')?.parentElement?.parentElement;

    expect(headingContainer).toBeInTheDocument();
    expect(headingContainer).toHaveClass('flex-col');
    expect(headingContainer).toHaveClass('sm:flex-row');
  });

  it('3. verifies styling values are not absolute widths that cause horizontal scrollbars on smaller viewports', () => {
    window.innerWidth = 375;
    fireEvent(window, new Event('resize'));

    render(<TechnologyGraph {...defaultProps} />);

    // Get the outer SVG/graph container
    const heading = screen.getByText('Technology Dependency Graph');
    const outerContainer = heading.closest('.p-5');

    // Get the inner canvas container that holds the SVG
    const canvasContainer = outerContainer?.querySelector('.relative');

    expect(canvasContainer).toBeInTheDocument();
    // Ensure it uses w-full to dynamically scale instead of absolute pixel widths
    expect(canvasContainer).toHaveClass('w-full');
    expect(canvasContainer).not.toHaveClass(/w-\[\d+px\]/);
  });

  it('4. checks that navigation components scale down gracefully on mobile viewport', () => {
    window.innerWidth = 375;
    fireEvent(window, new Event('resize'));

    render(<TechnologyGraph {...defaultProps} />);

    // Find the toolbar containing zoom/reset actions
    const zoomInButton = screen.getByTitle('Zoom In');
    const toolbar = zoomInButton.parentElement;

    expect(toolbar).toBeInTheDocument();
    // Ensure toolbar has responsive self-alignment classes to scale/flow gracefully
    expect(toolbar).toHaveClass('self-start');
    expect(toolbar).toHaveClass('sm:self-center');
  });

  it('5. asserts mobile-specific toggle states respond cleanly', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    window.innerWidth = 375;
    fireEvent(window, new Event('resize'));

    render(<TechnologyGraph {...defaultProps} onToggle={onToggle} />);

    const reactNode = screen.getByRole('button', { name: /React \(Frontend\)/i });
    expect(reactNode).toBeInTheDocument();

    reactNode.focus();
    await act(async () => {
      await user.keyboard('{Enter}');
    });

    expect(onToggle).toHaveBeenCalledWith('react');
  });
});
