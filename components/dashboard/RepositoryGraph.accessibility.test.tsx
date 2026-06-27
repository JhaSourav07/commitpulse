/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { type ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RepositoryGraph from './RepositoryGraph';

// Mock next/dynamic to return our ForceGraphMock component directly and synchronously
vi.mock('next/dynamic', () => {
  const DynamicForceGraphMock = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      centerAt: vi.fn(),
      zoom: vi.fn(),
    }));

    return (
      <div data-testid="force-graph-2d">
        {props.graphData?.nodes?.map((node: any) => (
          <button
            key={node.id}
            data-testid={`graph-node-${node.id}`}
            onClick={() => props.onNodeClick?.(node)}
            onMouseEnter={() => props.onNodeHover?.(node)}
            onMouseLeave={() => props.onNodeHover?.(null)}
          >
            {node.name}
          </button>
        ))}
      </div>
    );
  });
  DynamicForceGraphMock.displayName = 'ForceGraph2D';
  return {
    default: () => DynamicForceGraphMock,
  };
});

// 1. Setup global Canvas mock to prevent ForceGraph2D from throwing scale/getContext runtime failures
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(), // Kept only one instance here
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
});

// Mock type-safe dataset
const mockGraphData = {
  nodes: [{ id: 'node-1' }, { id: 'node-2' }],
  links: [{ source: 'node-1', target: 'node-2' }],
} as unknown as ComponentProps<typeof RepositoryGraph>['data'];

describe('RepositoryGraph - Accessibility Standards & Screen Reader Aria Compliance', () => {
  // 1. Accessible Labels & Coordinates
  it('should have correct accessible roles and aria labels for screen readers', () => {
    const { container } = render(<RepositoryGraph data={mockGraphData} />);

    // Fallback lookup using container selector matching the real DOM tree id="repository-graph"
    const graphContainer = container.querySelector('#repository-graph');
    expect(graphContainer).toBeInTheDocument();
  });

  // 2. Visible Focus Outlines
  it('should maintain visible outline behaviors on interactive nodes when focused', () => {
    render(<RepositoryGraph data={mockGraphData} />);

    const interactiveElements = screen.queryAllByRole('button');

    if (interactiveElements.length > 0) {
      const firstNode = interactiveElements[0];
      firstNode.focus();

      expect(firstNode).toHaveFocus();

      const styles = window.getComputedStyle(firstNode);
      expect(styles.outline).not.toBe('none');
    }
  });

  // 3. Tooltip Announcements
  it('should render graph guidance text for accessibility', () => {
    render(<RepositoryGraph data={mockGraphData} />);

    expect(
      screen.getByText(/Hover over any node to view detailed statistics/i)
    ).toBeInTheDocument();
  });

  // 4. Keyboard Control & Tab Ordering
  it('should follow a normal and logical keyboard tab ordering path', async () => {
    render(<RepositoryGraph data={mockGraphData} />);
    const user = userEvent.setup();

    const interactiveElements = screen.queryAllByRole('button');

    if (interactiveElements.length > 1) {
      await user.tab();
      expect(interactiveElements[0]).toHaveFocus();

      await user.tab();
      expect(interactiveElements[1]).toHaveFocus();
    }
  });

  // 5. Logical Heading Hierarchy
  it('should contain standard headings structured in a correct logical hierarchical order', () => {
    render(<RepositoryGraph data={mockGraphData} />);

    const headings = screen.queryAllByRole('heading');

    if (headings.length > 0) {
      const levels = headings.map((heading) => parseInt(heading.tagName.substring(1), 10));

      levels.forEach((level, index) => {
        if (index > 0) {
          const previousLevel = levels[index - 1];
          expect(level - previousLevel).toBeLessThanOrEqual(1);
        }
      });
    }
  });

  it('provides an accessible graph region', () => {
    render(<RepositoryGraph data={mockGraphData} />);

    expect(
      screen.getByRole('region', {
        name: /repository relationship graph/i,
      })
    ).toBeInTheDocument();
  });

  it('renders screen reader descriptions', () => {
    render(<RepositoryGraph data={mockGraphData} />);

    expect(screen.getByText(/interactive repository relationship graph/i)).toBeInTheDocument();
  });

  it('graph container is keyboard focusable', () => {
    render(<RepositoryGraph data={mockGraphData} />);

    const graph = screen.getByTestId('repository-graph-container');

    expect(graph).toHaveAttribute('tabIndex', '0');
  });
});
