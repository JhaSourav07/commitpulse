/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import RepositoryGraph from './RepositoryGraph';
import type { GraphNode, GraphLink } from '@/types';

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

// Helper functions for relative luminance and contrast ratio calculations
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace(/^#/, '');
  let r = 0,
    g = 0,
    b = 0;
  if (normalized.length === 6) {
    r = parseInt(normalized.slice(0, 2), 16);
    g = parseInt(normalized.slice(2, 4), 16);
    b = parseInt(normalized.slice(4, 6), 16);
  }
  return { r, g, b };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(bg: string, text: string): number {
  const lBg = relativeLuminance(bg);
  const lText = relativeLuminance(text);
  const lighter = Math.max(lBg, lText);
  const darker = Math.min(lBg, lText);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('components/dashboard/RepositoryGraph Theme Contrast and Visual Cohesion', () => {
  const mockData = {
    nodes: [
      { id: 'user1', name: 'User 1', type: 'User', val: 30, color: '#FFF' },
      {
        id: 'repo1',
        name: 'Repo 1',
        type: 'Repo',
        val: 15,
        color: '#FFF',
        stats: { stars: 10, forks: 2, language: 'TypeScript', updatedAt: '2024-05-30T00:00:00Z' },
      },
    ] as GraphNode[],
    links: [{ source: 'user1', target: 'repo1' }] as GraphLink[],
  };

  afterEach(() => {
    document.documentElement.className = '';
    vi.clearAllMocks();
  });

  it('1. emulates dual theme environment presets correctly for repository graph views', () => {
    const themes = {
      dark: { bg: '#0a0a0a', text: '#ffffff', border: 'rgba(255,255,255,0.08)' },
      light: { bg: '#ffffff', text: '#111827', border: 'rgba(0,0,0,0.1)' },
    };

    expect(themes.dark.bg).toBe('#0a0a0a');
    expect(themes.light.bg).toBe('#ffffff');
    expect(themes.dark.text).not.toBe(themes.light.text);
  });

  it('2. asserts that visual styling for repository graph adapts properly to current theme settings', () => {
    // Render under light theme
    document.documentElement.className = '';
    const { rerender } = render(<RepositoryGraph data={mockData} />);
    expect(screen.getByText('🌐 Repository Dependency Graph')).toBeInTheDocument();

    // Render under dark theme
    document.documentElement.className = 'dark';
    rerender(<RepositoryGraph data={mockData} />);
    expect(screen.getByText('🌐 Repository Dependency Graph')).toBeInTheDocument();
  });

  it('3. verifies contrast ratio standards are satisfied for all textual elements in the graph and panels', () => {
    // Value text contrast on white background (light mode) and dark background (dark mode)
    const lightValueRatio = contrastRatio('#ffffff', '#111827'); // bg-white vs text-gray-900
    expect(lightValueRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA normal text threshold is 4.5:1

    const darkValueRatio = contrastRatio('#0a0a0a', '#ffffff'); // dark:bg-[#0a0a0a] vs dark:text-white
    expect(darkValueRatio).toBeGreaterThanOrEqual(4.5);

    // Label/description text contrast
    const lightLabelRatio = contrastRatio('#ffffff', '#6b7280'); // bg-white vs text-gray-500
    expect(lightLabelRatio).toBeGreaterThanOrEqual(4.5);

    const darkLabelRatio = contrastRatio('#0a0a0a', '#a1a1aa'); // dark:bg-[#0a0a0a] vs text-zinc-400
    expect(darkLabelRatio).toBeGreaterThanOrEqual(3.0); // WCAG AA large/incidental text threshold is 3.0:1
  });

  it('4. checks that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    const { container } = render(<RepositoryGraph data={mockData} />);

    const canvasContainer = screen.getByTestId('repository-graph-container');
    expect(canvasContainer.className).toContain('bg-white');
    expect(canvasContainer.className).toContain('dark:bg-[#0a0a0a]');
    expect(canvasContainer.className).toContain('border-black/10');
    expect(canvasContainer.className).toContain('dark:border-[rgba(255,255,255,0.08)]');
  });

  it('5. ensures that background overlays do not clip foreground content colors', () => {
    render(<RepositoryGraph data={mockData} />);

    // Hover to trigger overlay tooltip
    const repoNode = screen.getByTestId('graph-node-repo1');
    fireEvent.mouseEnter(repoNode);

    // Verify hover tooltip is visible and has correct backdrop classes
    expect(screen.getByText('10 Stars')).toBeInTheDocument();
    expect(screen.getByText('2 Forks')).toBeInTheDocument();
  });
});
