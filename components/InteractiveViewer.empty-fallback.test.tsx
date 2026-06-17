import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InteractiveViewer from './InteractiveViewer';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./dashboard/VisualizationTooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('InteractiveViewer - Empty/Missing Inputs', () => {
  it('renders successfully with null children', () => {
    render(<InteractiveViewer>{null}</InteractiveViewer>);

    expect(screen.getByLabelText(/interactive viewer/i)).toBeInTheDocument();
  });

  it('renders successfully with an empty fragment', () => {
    render(
      <InteractiveViewer>
        <></>
      </InteractiveViewer>
    );

    expect(screen.getByLabelText(/interactive viewer/i)).toBeInTheDocument();
  });

  it('maintains container structure when no content is provided', () => {
    const { container } = render(<InteractiveViewer>{null}</InteractiveViewer>);

    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByTestId('parallax-bg-layer')).toBeInTheDocument();
  });

  it('renders correctly in 3D mode without callbacks', () => {
    render(<InteractiveViewer is3DMode>{null}</InteractiveViewer>);

    expect(screen.getByLabelText(/interactive 3d viewer/i)).toBeInTheDocument();
  });

  it('handles keyboard reset interaction without crashing', () => {
    render(<InteractiveViewer>{null}</InteractiveViewer>);

    const viewer = screen.getByLabelText(/interactive viewer/i);

    fireEvent.keyDown(viewer, { key: 'r' });

    expect(viewer).toBeInTheDocument();
  });
});
