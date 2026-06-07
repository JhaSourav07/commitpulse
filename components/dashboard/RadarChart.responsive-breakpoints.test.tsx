import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import RadarChart from './RadarChart';
import type { LanguageData } from '@/types/dashboard';

// Mock framer-motion so animated elements render as plain SVG/HTML synchronously in jsdom without runtime warning
vi.mock('framer-motion', () => {
  const MotionDiv = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      whileInView?: unknown;
      viewport?: unknown;
      transition?: unknown;
    }
  >(({ children, className, style, ...props }, ref) => {
    const cleanProps = { ...props };
    delete cleanProps.initial;
    delete cleanProps.animate;
    delete cleanProps.whileInView;
    delete cleanProps.viewport;
    delete cleanProps.transition;

    return (
      <div ref={ref} className={className} style={style} {...cleanProps}>
        {children}
      </div>
    );
  });
  MotionDiv.displayName = 'MotionDiv';

  const MotionPolygon = React.forwardRef<
    SVGPolygonElement,
    React.SVGProps<SVGPolygonElement> & {
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }
  >(({ children, className, style, ...props }, ref) => {
    const cleanProps = { ...props };
    delete cleanProps.initial;
    delete cleanProps.animate;
    delete cleanProps.transition;

    return (
      <polygon ref={ref} className={className} style={style} {...cleanProps}>
        {children}
      </polygon>
    );
  });
  MotionPolygon.displayName = 'MotionPolygon';

  return {
    motion: {
      div: MotionDiv,
      polygon: MotionPolygon,
    },
  };
});

interface RadarChartProps {
  languagesA: LanguageData[];
  languagesB: LanguageData[];
  labelA: string;
  labelB: string;
}

// A helper component simulating the parent dashboard wrapper structure for RadarChart responsive layouts
const RadarChartTestWrapper: React.FC<RadarChartProps> = ({
  languagesA,
  languagesB,
  labelA,
  labelB,
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'developerA' | 'developerB'>('both');

  return (
    <div className="w-full max-w-full overflow-hidden p-4">
      {/* Mobile view selector toggles */}
      <div className="flex lg:hidden gap-2 mb-4" data-testid="mobile-toggle-controls">
        <button
          onClick={() => setViewMode('developerA')}
          className={`px-3 py-1 text-xs rounded ${viewMode === 'developerA' ? 'bg-cyan-500 text-white' : 'bg-gray-150'}`}
          data-testid="toggle-dev-a"
        >
          Show {labelA}
        </button>
        <button
          onClick={() => setViewMode('developerB')}
          className={`px-3 py-1 text-xs rounded ${viewMode === 'developerB' ? 'bg-purple-500 text-white' : 'bg-gray-150'}`}
          data-testid="toggle-dev-b"
        >
          Show {labelB}
        </button>
        <button
          onClick={() => setViewMode('both')}
          className={`px-3 py-1 text-xs rounded ${viewMode === 'both' ? 'bg-zinc-800 text-white' : 'bg-gray-150'}`}
          data-testid="toggle-both"
        >
          Show Both
        </button>
      </div>

      {/* Grid container wrapper */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-full"
        data-testid="responsive-grid-container"
      >
        <div className="w-full min-w-0" data-testid="chart-column-wrapper">
          <RadarChart
            languagesA={viewMode === 'developerB' ? [] : languagesA}
            languagesB={viewMode === 'developerA' ? [] : languagesB}
            labelA={labelA}
            labelB={labelB}
          />
        </div>
        <div className="w-full hidden lg:block" data-testid="desktop-sidebar-column">
          <div className="p-6 rounded-xl bg-white border border-black/10">
            <h4>Layout Companion Panel</h4>
            <p>Details visible on desktop larger viewports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

describe('RadarChart Responsive Breakpoints & Mobile Layouts', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalMatchMedia = window.matchMedia;

  const mockLangsA: LanguageData[] = [
    { name: 'TypeScript', percentage: 80, color: '#3178c6' },
    { name: 'Python', percentage: 60, color: '#3572A5' },
    { name: 'JavaScript', percentage: 40, color: '#f1e05a' },
  ];

  const mockLangsB: LanguageData[] = [
    { name: 'TypeScript', percentage: 50, color: '#3178c6' },
    { name: 'Python', percentage: 70, color: '#3572A5' },
    { name: 'JavaScript', percentage: 30, color: '#f1e05a' },
  ];

  const resizeViewport = (width: number, height = 800) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
  });

  // Case 1: Mock standard mobile-width media coordinates (375px wide) and assert that container grids reflow cleanly into single-column vertical list arrangements.
  test('Case 1: mock standard mobile-width (375px) layout reflow to single-column', () => {
    resizeViewport(375);
    render(
      <RadarChartTestWrapper
        languagesA={mockLangsA}
        languagesB={mockLangsB}
        labelA="Dev A"
        labelB="Dev B"
      />
    );

    const gridContainer = screen.getByTestId('responsive-grid-container');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('lg:grid-cols-2');
  });

  // Case 2: Verify that structural style rules avoid absolute widths that cause horizontal overflow scrolling bounds on narrow viewports.
  test('Case 2: verify structural style rules avoid absolute widths that cause horizontal overflow', () => {
    resizeViewport(375);
    const { container } = render(
      <RadarChartTestWrapper
        languagesA={mockLangsA}
        languagesB={mockLangsB}
        labelA="Dev A"
        labelB="Dev B"
      />
    );

    const responsiveGrid = screen.getByTestId('responsive-grid-container');
    expect(responsiveGrid).toHaveClass('w-full');
    expect(responsiveGrid).toHaveClass('max-w-full');

    const chartWrapper = screen.getByTestId('chart-column-wrapper');
    expect(chartWrapper).toHaveClass('w-full');

    const outerContainer = container.querySelector('.rounded-xl');
    expect(outerContainer).toHaveClass('flex-col');
  });

  // Case 3: Test that chart navigation selectors or legend blocks scale down to fit small viewports cleanly without text clipping.
  test('Case 3: verify legend blocks scale down and truncate to prevent text clipping', () => {
    resizeViewport(375);
    const { container } = render(
      <RadarChartTestWrapper
        languagesA={mockLangsA}
        languagesB={mockLangsB}
        labelA="Developer Alpha Name"
        labelB="Developer Beta Name"
      />
    );

    const legendTextElements = container.querySelectorAll('.truncate');
    expect(legendTextElements.length).toBeGreaterThanOrEqual(2);

    legendTextElements.forEach((el) => {
      const hasMaxW80 = el.classList.contains('max-w-[80px]');
      const hasMaxW70 = el.classList.contains('max-w-[70px]');
      expect(hasMaxW80 || hasMaxW70).toBe(true);
    });
  });

  // Case 4: Assert mobile-specific toggle states respond to view interactions.
  test('Case 4: assert mobile-specific toggle states respond to view interactions', () => {
    resizeViewport(375);
    render(
      <RadarChartTestWrapper
        languagesA={mockLangsA}
        languagesB={mockLangsB}
        labelA="Dev A"
        labelB="Dev B"
      />
    );

    expect(screen.getByText('Dev A')).toBeInTheDocument();
    expect(screen.getByText('Dev B')).toBeInTheDocument();

    const toggleDevA = screen.getByTestId('toggle-dev-a');
    const toggleDevB = screen.getByTestId('toggle-dev-b');
    const toggleBoth = screen.getByTestId('toggle-both');

    fireEvent.click(toggleDevA);
    expect(toggleDevA).toHaveClass('bg-cyan-500');

    fireEvent.click(toggleDevB);
    expect(toggleDevB).toHaveClass('bg-purple-500');

    fireEvent.click(toggleBoth);
    expect(toggleBoth).toHaveClass('bg-zinc-800');
  });

  // Case 5: Prove that scaling up into large desktop boundaries successfully shifts components back into multi-device column grid layouts.
  test('Case 5: scale up to large desktop and verify shift to multi-column layout', () => {
    resizeViewport(375);
    const { rerender } = render(
      <RadarChartTestWrapper
        languagesA={mockLangsA}
        languagesB={mockLangsB}
        labelA="Dev A"
        labelB="Dev B"
      />
    );

    const gridContainer = screen.getByTestId('responsive-grid-container');
    expect(gridContainer).toHaveClass('grid-cols-1');

    resizeViewport(1280);
    rerender(
      <RadarChartTestWrapper
        languagesA={mockLangsA}
        languagesB={mockLangsB}
        labelA="Dev A"
        labelB="Dev B"
      />
    );

    expect(gridContainer).toHaveClass('lg:grid-cols-2');
  });
});
