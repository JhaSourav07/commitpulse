import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { TechnologyGraph } from './TechnologyGraph';

describe('TechnologyGraph Mouse Interactivity', () => {
  const onToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers onToggle when a technology node is clicked', () => {
    render(<TechnologyGraph selected={[]} onToggle={onToggle} />);

    const reactNode = screen.getByRole('button', {
      name: /React \(Frontend\)/i,
    });

    fireEvent.click(reactNode);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('react');
  });

  it('maintains interactive node visibility during mouse enter and leave events', () => {
    render(<TechnologyGraph selected={[]} onToggle={onToggle} />);

    const reactNode = screen.getByRole('button', {
      name: /React \(Frontend\)/i,
    });

    fireEvent.mouseEnter(reactNode);

    expect(reactNode).toBeInTheDocument();
    expect(reactNode).toHaveClass('cursor-pointer');

    fireEvent.mouseLeave(reactNode);

    expect(reactNode).toBeInTheDocument();
  });

  it('supports node drag initialization through mouse down interactions', () => {
    render(<TechnologyGraph selected={[]} onToggle={onToggle} />);

    const reactNode = screen.getByRole('button', {
      name: /React \(Frontend\)/i,
    });

    fireEvent.mouseDown(reactNode, {
      clientX: 100,
      clientY: 100,
    });

    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();

    expect(reactNode).toBeInTheDocument();
  });

  it('handles mouse wheel zoom interactions without breaking graph rendering', () => {
    const { container } = render(<TechnologyGraph selected={[]} onToggle={onToggle} />);

    const graphContainer =
      container.querySelector('.cursor-grab') || container.querySelector('svg')?.parentElement;

    expect(graphContainer).toBeTruthy();

    fireEvent.wheel(graphContainer!, {
      deltaY: -100,
    });

    fireEvent.wheel(graphContainer!, {
      deltaY: 100,
    });

    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();

    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
  });

  it('supports graph panning interactions through mouse drag events', () => {
    const { container } = render(<TechnologyGraph selected={[]} onToggle={onToggle} />);

    const graphContainer =
      container.querySelector('.cursor-grab') || container.querySelector('svg')?.parentElement;

    expect(graphContainer).toBeTruthy();

    fireEvent.mouseDown(graphContainer!, {
      clientX: 100,
      clientY: 100,
    });

    fireEvent.mouseMove(graphContainer!, {
      clientX: 150,
      clientY: 150,
    });

    fireEvent.mouseUp(graphContainer!);

    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();

    expect(graphContainer).toBeInTheDocument();
  });
});
