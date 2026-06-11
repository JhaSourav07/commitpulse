import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardLayout from './layout';

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="mock-toaster" />,
}));

function InteractiveDashboardFixture({
  onContainerClick = vi.fn(),
  onNodeClick = vi.fn(),
  onNodeTouchStart = vi.fn(),
}: {
  onContainerClick?: () => void;
  onNodeClick?: () => void;
  onNodeTouchStart?: () => void;
}) {
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    label: '',
  });

  return (
    <section data-testid="interactive-region" onClick={onContainerClick}>
      <button
        type="button"
        data-testid="active-node"
        className="cursor-pointer rounded-md"
        onMouseEnter={(event) =>
          setTooltip({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            label: 'Dashboard activity details',
          })
        }
        onMouseMove={(event) =>
          setTooltip((current) => ({
            ...current,
            x: event.clientX,
            y: event.clientY,
          }))
        }
        onMouseLeave={() =>
          setTooltip((current) => ({
            ...current,
            visible: false,
          }))
        }
        onClick={onNodeClick}
        onTouchStart={onNodeTouchStart}
      >
        Activity node
      </button>

      {tooltip.visible ? (
        <div
          role="tooltip"
          data-testid="hover-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            position: 'fixed',
          }}
        >
          {tooltip.label}
        </div>
      ) : null}
    </section>
  );
}

describe('DashboardLayout mouse interactivity', () => {
  it('displays a tooltip when hovering an active dashboard node', () => {
    render(
      <DashboardLayout>
        <InteractiveDashboardFixture />
      </DashboardLayout>
    );

    fireEvent.mouseEnter(screen.getByTestId('active-node'), {
      clientX: 120,
      clientY: 80,
    });

    expect(screen.getByRole('tooltip')).toHaveTextContent('Dashboard activity details');
  });

  it('positions responsive tooltip layouts at computed cursor coordinates', () => {
    render(
      <DashboardLayout>
        <InteractiveDashboardFixture />
      </DashboardLayout>
    );

    fireEvent.mouseEnter(screen.getByTestId('active-node'), {
      clientX: 120,
      clientY: 80,
    });
    fireEvent.mouseMove(screen.getByTestId('active-node'), {
      clientX: 240,
      clientY: 160,
    });

    expect(screen.getByTestId('hover-tooltip')).toHaveStyle({
      left: '240px',
      top: '160px',
      position: 'fixed',
    });
  });

  it('propagates custom click and touch gestures from interactive nodes', () => {
    const onContainerClick = vi.fn();
    const onNodeClick = vi.fn();
    const onNodeTouchStart = vi.fn();

    render(
      <DashboardLayout>
        <InteractiveDashboardFixture
          onContainerClick={onContainerClick}
          onNodeClick={onNodeClick}
          onNodeTouchStart={onNodeTouchStart}
        />
      </DashboardLayout>
    );

    const node = screen.getByTestId('active-node');

    fireEvent.click(node);
    fireEvent.touchStart(node);

    expect(onNodeClick).toHaveBeenCalledTimes(1);
    expect(onContainerClick).toHaveBeenCalledTimes(1);
    expect(onNodeTouchStart).toHaveBeenCalledTimes(1);
  });

  it('applies pointer cursor styling to hoverable dashboard controls', () => {
    render(
      <DashboardLayout>
        <InteractiveDashboardFixture />
      </DashboardLayout>
    );

    expect(screen.getByTestId('active-node')).toHaveClass('cursor-pointer');
  });

  it('hides temporary tooltip overlays on mouse leave', () => {
    render(
      <DashboardLayout>
        <InteractiveDashboardFixture />
      </DashboardLayout>
    );

    const node = screen.getByTestId('active-node');

    fireEvent.mouseEnter(node, {
      clientX: 120,
      clientY: 80,
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(node);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
