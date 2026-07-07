import { render, screen, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { TechnologyGraph } from './TechnologyGraph';

afterEach(() => {
  cleanup();
});

describe('TechnologyGraph Component - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('1. renders successfully with empty array for selected props', () => {
    expect(() => {
      render(<TechnologyGraph selected={[]} onToggle={vi.fn()} />);
    }).not.toThrow();

    // Verify fallback text / empty selection marker exists
    expect(screen.getByText('0 Selected Technologies')).toBeInTheDocument();
    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();
  });

  it('2. handles null or undefined selected parameters gracefully without crashing', () => {
    // Test with null
    expect(() => {
      render(<TechnologyGraph selected={null as unknown as string[]} onToggle={vi.fn()} />);
    }).not.toThrow();
    expect(screen.getByText('0 Selected Technologies')).toBeInTheDocument();
    cleanup();

    // Test with undefined
    expect(() => {
      render(<TechnologyGraph selected={undefined as unknown as string[]} onToggle={vi.fn()} />);
    }).not.toThrow();
    expect(screen.getByText('0 Selected Technologies')).toBeInTheDocument();
  });

  it('3. maintains standard layout elements and styles in default empty layout state', () => {
    const { container } = render(<TechnologyGraph selected={[]} onToggle={vi.fn()} />);

    // Verify the grid background decorator class is present
    const gridBackground = container.querySelector('.absolute.inset-0.pointer-events-none');
    expect(gridBackground).toBeInTheDocument();

    // Verify toolbar control buttons are visible and present
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    expect(screen.getByTitle('Reset Graph Layout')).toBeInTheDocument();

    // Verify key DOM structure (SVG container) exists
    const svgElement = container.querySelector('svg.w-full.h-full');
    expect(svgElement).toBeInTheDocument();
  });

  it('4. displays instructions correctly even with empty selection', () => {
    render(<TechnologyGraph selected={[]} onToggle={vi.fn()} />);

    expect(
      screen.getByText(
        'Ecosystem recommendations & compatibility paths. Click to select, drag to arrange.'
      )
    ).toBeInTheDocument();
  });

  it('5. renders the default 10 nodes (React, Next.js, Tailwind, etc.) when selection is empty', () => {
    const { container } = render(<TechnologyGraph selected={[]} onToggle={vi.fn()} />);

    // There should be a default set of nodes in the graph
    const nodes = container.querySelectorAll('.cursor-pointer');
    expect(nodes.length).toBe(10);

    // Verify specific technology nodes exist in the graph by their text labels
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument();
  });
});
