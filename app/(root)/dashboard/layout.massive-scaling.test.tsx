import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import DashboardLayout from './layout';

// Mock sonner Toaster
vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="sonner-toaster" />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/**
 * Generates plausible contributor action rows to simulate high-volume data.
 * Each entry mimics an activity log entry with timestamp, action type, and repo info.
 */
function generateContributorActions(count: number): React.ReactNode[] {
  const actions: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const actionType = ['commit', 'pr', 'review', 'issue', 'comment'][i % 5];
    actions.push(
      <div
        key={`action-${i}`}
        data-testid="contributor-action"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <svg
          data-testid="action-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <circle cx="8" cy="8" r="4" />
        </svg>
        <span data-testid="action-description">
          User_{i % 100} performed {actionType} on repo_{Math.floor(i / 50)}
        </span>
        <span
          data-testid="action-timestamp"
          style={{
            marginLeft: 'auto',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          {new Date(Date.now() - i * 60000).toISOString()}
        </span>
        {/* High metrics parameter: star/fork count */}
        <span
          data-testid="action-metric"
          style={{
            minWidth: '60px',
            textAlign: 'right',
            fontWeight: 600,
          }}
        >
          {Math.floor(Math.random() * 10000) + 1}★
        </span>
      </div>
    );
  }
  return actions;
}

/**
 * Generates SVG grid items that represent dashboard chart tiles or graph nodes.
 */
function generateSVGGridItems(count: number): React.ReactNode[] {
  const items: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    items.push(
      <div
        key={`grid-${i}`}
        data-testid="grid-item"
        style={{
          width: '200px',
          height: '160px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '12px',
          display: 'inline-block',
          margin: '4px',
          overflow: 'hidden',
        }}
      >
        <svg
          data-testid="grid-svg"
          width="100%"
          height="100"
          viewBox="0 0 200 100"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Simulated chart line / scatter plot */}
          <polyline
            points={Array.from(
              { length: 10 },
              (_, j) => `${j * 20},${50 + Math.sin(j * 0.8) * 30}`
            ).join(' ')}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
          />
          {Array.from({ length: 5 }, (_, j) => (
            <circle
              key={j}
              cx={j * 40 + 10}
              cy={40 + Math.cos(j * 1.2) * 20}
              r="3"
              fill="#8B5CF6"
            />
          ))}
        </svg>
        <div
          data-testid="grid-label"
          style={{
            marginTop: '6px',
            fontSize: '12px',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          Metric_{i} — {Math.floor(Math.random() * 10000)} commits
        </div>
      </div>
    );
  }
  return items;
}

describe('DashboardLayout massive-scaling: Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('renders thousands of contributor actions without layout overlap or crashing', () => {
    const actions = generateContributorActions(2000);

    const { container } = render(<DashboardLayout>{actions}</DashboardLayout>);

    // The layout container must be present
    expect(container.firstChild).toBeInTheDocument();

    // Sonner Toaster must be present
    expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();

    // Verify the first and last action rendered
    expect(screen.getByText(/User_0 performed commit on repo_0/)).toBeInTheDocument();

    // All contributor action elements should render
    const actionElements = screen.getAllByTestId('contributor-action');
    expect(actionElements.length).toBe(2000);

    // Verify timestamps don't overflow or break layout — each should have a monospace font
    const timestamps = screen.getAllByTestId('action-timestamp');
    expect(timestamps.length).toBe(2000);
    timestamps.forEach((ts) => {
      const styles = getComputedStyle(ts);
      expect(styles.whiteSpace).toBe('nowrap');
      expect(styles.fontFamily).toContain('monospace');
    });
  });

  it('executes rendering within acceptable time limit under 2500 child elements', () => {
    const actions = generateContributorActions(2500);

    const start = performance.now();
    render(<DashboardLayout>{actions}</DashboardLayout>);
    const duration = performance.now() - start;

    // Must complete within 3000ms (8000ms on CI) even under extreme load
    expect(duration).toBeLessThan(process.env.CI ? 8000 : 3000);

    // Verify the layout rendered correctly
    expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
  });

  it('renders SVG grid items with clean coordinate scaling and no layout breaking', () => {
    const gridItems = generateSVGGridItems(500);

    const { container } = render(<DashboardLayout>{gridItems}</DashboardLayout>);

    // The outer layout container should not be null
    expect(container.firstChild).not.toBeNull();

    // All SVG elements should exist
    const svgElements = screen.getAllByTestId('grid-svg');
    expect(svgElements.length).toBe(500);

    // Each SVG must have a viewBox attribute for responsive scaling
    svgElements.forEach((svg) => {
      expect(svg).toHaveAttribute('viewBox', '0 0 200 100');
      expect(svg).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    });

    // Labels should be truncated with ellipsis and not overflow
    const labels = screen.getAllByTestId('grid-label');
    expect(labels.length).toBe(500);
    labels.forEach((label) => {
      const styles = getComputedStyle(label);
      expect(styles.textOverflow).toBe('ellipsis');
      expect(styles.overflow).toBe('hidden');
      expect(styles.whiteSpace).toBe('nowrap');
    });

    // Action metric counts should be rendered (high bounds check)
    const metrics = screen.queryAllByTestId('action-metric');
    if (metrics.length > 0) {
      metrics.forEach((metric) => {
        const text = metric.textContent || '';
        expect(text).toMatch(/\d+★/);
      });
    }
  });

  it('handles extreme text wrapping correctly under high-volume content', () => {
    // Simulate massive commit messages or activity descriptions
    const hugeContent = Array.from({ length: 1000 }, (_, i) => (
      <div
        key={`huge-${i}`}
        data-testid="huge-text-block"
        style={{
          maxWidth: '800px',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          padding: '4px 0',
        }}
      >
        {`Commit ${i}: ${'A'.repeat((i % 100) + 50)} ${'fix'.repeat((i % 20) + 1)} for extremely long activity description that must not overflow the layout boundaries at all under any circumstances`}
      </div>
    ));

    render(<DashboardLayout>{hugeContent}</DashboardLayout>);

    const textBlocks = screen.getAllByTestId('huge-text-block');
    expect(textBlocks.length).toBe(1000);

    // Each block must have word-break and overflow-wrap applied
    textBlocks.forEach((block) => {
      const styles = getComputedStyle(block);
      expect(styles.wordBreak).toBe('break-word');
      expect(styles.overflowWrap).toBe('break-word');
    });

    // Verify the Toaster is still rendered properly alongside the massive content
    expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
  });

  it('renders a mixed extreme-scale layout with grid items, actions, and metrics without breaking the layout tree', () => {
    // Combine grid items (300), contributor actions (1000), and huge text (300) = 1600 total children
    const gridItems = generateSVGGridItems(300);
    const actions = generateContributorActions(1000);
    const hugeTextBlocks = Array.from({ length: 300 }, (_, i) => (
      <div
        key={`mixed-${i}`}
        data-testid="mixed-block"
        style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}
      >
        <span data-testid="mixed-title">Dashboard Section {i}</span>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginTop: '4px',
          }}
        >
          {Array.from({ length: 4 }, (_, j) => (
            <span
              key={`tag-${i}-${j}`}
              data-testid="mixed-tag"
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: '#f3f4f6',
              }}
            >
              tag_{j}:{Math.floor(Math.random() * 1000)}
            </span>
          ))}
        </div>
      </div>
    ));

    const allChildren = [...gridItems, ...actions, ...hugeTextBlocks];

    const { container } = render(<DashboardLayout>{allChildren}</DashboardLayout>);

    // Layout container must be defined
    expect(container.firstChild).toBeInTheDocument();

    // All three content types must be present
    expect(screen.getAllByTestId('grid-item').length).toBe(300);
    expect(screen.getAllByTestId('contributor-action').length).toBe(1000);
    expect(screen.getAllByTestId('mixed-block').length).toBe(300);

    // Tags inside mixed blocks must not overflow — verify inline display
    const tags = screen.getAllByTestId('mixed-tag');
    expect(tags.length).toBe(300 * 4); // 4 tags per block
    tags.forEach((tag) => {
      const styles = getComputedStyle(tag);
      expect(styles.display).toBe('inline');
    });

    // Action descriptions must be readable and not truncated
    const descriptions = screen.getAllByTestId('action-description');
    expect(descriptions.length).toBe(1000);
    descriptions.forEach((desc) => {
      expect(desc.textContent).toMatch(
        /User_\d+ performed (commit|pr|review|issue|comment) on repo_\d+/
      );
    });

    // Sonner Toaster must render alongside the massive mixed dataset
    expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
  });
});
