import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import InteractiveViewer from './InteractiveViewer';

// Mock portal tooltip dependencies
vi.mock('./dashboard/VisualizationTooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="visualization-tooltip">{children}</div>
  ),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function generateMassiveDataset(count: number) {
  return Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className="interactive-tower"
      data-date={`2025-01-${String((i % 28) + 1).padStart(2, '0')}`}
      data-count={String(i)}
      data-metric={i % 2 === 0 ? 'Peak day' : 'Active day'}
    >
      Tower {i}
    </div>
  ));
}

describe('InteractiveViewer Massive Scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders thousands of interactive towers without crashing', () => {
    render(
      <InteractiveViewer>
        <div>{generateMassiveDataset(5000)}</div>
      </InteractiveViewer>
    );

    expect(screen.getByText('Tower 0')).toBeInTheDocument();
    expect(screen.getByText('Tower 4999')).toBeInTheDocument();
  });

  it('renders all parallax particles under heavy content load', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>{generateMassiveDataset(3000)}</div>
      </InteractiveViewer>
    );

    const backgroundLayer = container.querySelector('[data-testid="parallax-bg-layer"]');

    expect(backgroundLayer).toBeTruthy();

    // 20 deterministic particles + cursor glow
    const particleDivs = backgroundLayer?.querySelectorAll('div') ?? [];

    expect(particleDivs.length).toBeGreaterThanOrEqual(21);
  });

  it('supports repeated zoom operations at extreme bounds', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Heavy Content</div>
      </InteractiveViewer>
    );

    const viewer = container.firstChild as HTMLElement;

    for (let i = 0; i < 100; i++) {
      fireEvent.keyDown(viewer, { key: '+' });
    }

    const contentLayer = container.querySelector('[style*="scale"]') as HTMLElement;

    expect(contentLayer.style.transform).toContain('scale(3)');

    for (let i = 0; i < 200; i++) {
      fireEvent.keyDown(viewer, { key: '-' });
    }

    expect(contentLayer.style.transform).toContain('scale(0.5)');
  });

  it('handles extreme keyboard panning without layout failure', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>{generateMassiveDataset(1000)}</div>
      </InteractiveViewer>
    );

    const viewer = container.firstChild as HTMLElement;

    for (let i = 0; i < 500; i++) {
      fireEvent.keyDown(viewer, { key: 'ArrowRight' });
      fireEvent.keyDown(viewer, { key: 'ArrowDown' });
    }

    const contentLayer = container.querySelector('[style*="translate"]') as HTMLElement;

    expect(contentLayer.style.transform).toContain('translate');
  });

  it('shows tooltip correctly for items within massive datasets', async () => {
    const { container } = render(
      <InteractiveViewer>
        <div>{generateMassiveDataset(2500)}</div>
      </InteractiveViewer>
    );

    const tower = container.querySelector('.interactive-tower') as HTMLElement;

    expect(tower).toBeTruthy();

    tower.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      top: 100,
      width: 20,
      height: 40,
      right: 120,
      bottom: 140,
      x: 100,
      y: 100,
      toJSON: () => {},
    }));

    fireEvent.pointerMove(tower, {
      clientX: 110,
      clientY: 110,
    });

    expect(await screen.findByTestId('visualization-tooltip')).toBeInTheDocument();
  });
});
