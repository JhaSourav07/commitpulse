import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

import InteractiveViewer, { formatDate } from './InteractiveViewer';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('./dashboard/VisualizationTooltip', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="visualization-tooltip">
      <div>{title}</div>
      {children}
    </div>
  ),
}));

describe('InteractiveViewer Error Resilience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
      configurable: true,
      value: vi.fn(),
    });

    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders successfully with minimal content without crashing', () => {
    render(
      <InteractiveViewer>
        <div data-testid="viewer-content">Viewer Content</div>
      </InteractiveViewer>
    );

    expect(screen.getByTestId('viewer-content')).toBeInTheDocument();
    expect(screen.getByText('Viewer Content')).toBeInTheDocument();
  });

  it('handles invalid date inputs safely through formatDate fallbacks', () => {
    expect(() => formatDate('')).not.toThrow();
    expect(() => formatDate('invalid-date')).not.toThrow();
    expect(() => formatDate('2025-invalid-date')).not.toThrow();

    expect(formatDate('')).toBe('');
    expect(formatDate('invalid-date')).toBe('invalid-date');
    expect(formatDate('2025-invalid-date')).toBe('2025-invalid-date');
  });

  it('does not crash in 3D mode when optional callbacks are omitted', () => {
    render(
      <InteractiveViewer is3DMode>
        <div>3D Content</div>
      </InteractiveViewer>
    );

    const viewer = screen.getByText('3D Content').parentElement;

    expect(viewer).toBeInTheDocument();

    expect(() => {
      fireEvent.pointerDown(viewer!, {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
      });

      fireEvent.pointerMove(viewer!, {
        clientX: 140,
        clientY: 140,
        pointerId: 1,
      });

      fireEvent.pointerUp(viewer!, {
        clientX: 140,
        clientY: 140,
        pointerId: 1,
      });

      fireEvent.doubleClick(viewer!);
    }).not.toThrow();
  });

  it('ignores malformed interactive tower elements without throwing runtime errors', () => {
    render(
      <InteractiveViewer>
        <div className="interactive-tower" data-testid="broken-tower" />
      </InteractiveViewer>
    );

    const viewer = screen.getByTestId('broken-tower').parentElement;
    const tower = screen.getByTestId('broken-tower');

    expect(() => {
      fireEvent.pointerMove(viewer!, {
        clientX: 50,
        clientY: 50,
        target: tower,
      });
    }).not.toThrow();

    expect(tower).toBeInTheDocument();
  });

  it('remains stable when pointer leave occurs after interaction events', () => {
    render(
      <InteractiveViewer>
        <div data-testid="viewer-content">Viewer Content</div>
      </InteractiveViewer>
    );

    const viewer = screen.getByTestId('viewer-content').parentElement;

    expect(() => {
      fireEvent.pointerEnter(viewer!);

      fireEvent.pointerMove(viewer!, {
        clientX: 120,
        clientY: 120,
      });

      fireEvent.pointerLeave(viewer!);
    }).not.toThrow();

    expect(screen.getByTestId('viewer-content')).toBeInTheDocument();
  });
});
