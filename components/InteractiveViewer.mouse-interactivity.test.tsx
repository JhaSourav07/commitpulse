import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import InteractiveViewer from './InteractiveViewer';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./dashboard/VisualizationTooltip', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="visualization-tooltip">
      <div>{title}</div>
      {children}
    </div>
  ),
}));

const rect: DOMRect = {
  left: 0,
  top: 0,
  right: 600,
  bottom: 400,
  width: 600,
  height: 400,
  x: 0,
  y: 0,
  toJSON: () => ({}),
};

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect);

  Object.defineProperty(Element.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn(),
  });

  Object.defineProperty(Element.prototype, 'releasePointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function Tower() {
  return (
    <div
      className="interactive-tower"
      data-date="2025-06-15"
      data-count="42"
      data-metric="Peak day"
    >
      Tower
    </div>
  );
}

describe('InteractiveViewer Mouse Interactivity', () => {
  it('1. shows tooltip while hovering interactive tower', () => {
    const { container } = render(
      <InteractiveViewer>
        <Tower />
      </InteractiveViewer>
    );

    const tower = container.querySelector('.interactive-tower') as HTMLElement;

    act(() => {
      fireEvent.pointerMove(tower);
    });

    expect(screen.getByTestId('visualization-tooltip')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('2. exposes interactive cursor styling', () => {
    render(
      <InteractiveViewer>
        <div>Viewer</div>
      </InteractiveViewer>
    );

    const viewer = screen.getByLabelText(/interactive viewer/i);

    expect(viewer.className).toContain('cursor-grab');
    expect(viewer.className).toContain('active:cursor-grabbing');
  });

  it('3. supports pointer tap interactions', () => {
    const { container } = render(
      <InteractiveViewer>
        <Tower />
      </InteractiveViewer>
    );

    const viewer = container.firstChild as HTMLElement;
    const tower = container.querySelector('.interactive-tower') as HTMLElement;

    document.elementFromPoint = vi
      .fn()
      .mockReturnValue(tower) as unknown as typeof document.elementFromPoint;

    act(() => {
      fireEvent.pointerDown(viewer, {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
      });

      fireEvent.pointerUp(viewer, {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
      });
    });

    expect(screen.getByTestId('visualization-tooltip')).toBeInTheDocument();
  });

  it('4. keeps viewer interactive after hover movement', () => {
    render(
      <InteractiveViewer>
        <div data-testid="viewer-content">Content</div>
      </InteractiveViewer>
    );

    const viewer = screen.getByTestId('viewer-content').parentElement!;

    fireEvent.pointerEnter(viewer);

    fireEvent.pointerMove(viewer, {
      clientX: 120,
      clientY: 120,
    });

    fireEvent.pointerLeave(viewer);

    expect(screen.getByTestId('viewer-content')).toBeInTheDocument();
  });

  it('5. removes tooltip after pointer leaves', () => {
    const { container } = render(
      <InteractiveViewer>
        <Tower />
      </InteractiveViewer>
    );

    const viewer = container.firstChild as HTMLElement;
    const tower = container.querySelector('.interactive-tower') as HTMLElement;

    act(() => {
      fireEvent.pointerMove(tower);
    });

    expect(screen.getByTestId('visualization-tooltip')).toBeInTheDocument();

    act(() => {
      fireEvent.pointerLeave(viewer);
    });

    expect(screen.queryByTestId('visualization-tooltip')).toBeNull();
  });
});
