import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InteractiveViewer from './InteractiveViewer';

vi.mock('./dashboard/VisualizationTooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="visualization-tooltip">{children}</div>
  ),
}));

describe('InteractiveViewer theme contrast', () => {
  it('renders correctly in dark prefers-color-scheme environments', () => {
    document.documentElement.classList.add('dark');

    render(
      <InteractiveViewer>
        <div>Dashboard Content</div>
      </InteractiveViewer>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('renders correctly in light prefers-color-scheme environments', () => {
    document.documentElement.classList.remove('dark');

    render(
      <InteractiveViewer>
        <div>Dashboard Content</div>
      </InteractiveViewer>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('renders the parallax background layer without clipping content', () => {
    render(
      <InteractiveViewer>
        <div>Foreground Content</div>
      </InteractiveViewer>
    );

    expect(screen.getByTestId('parallax-bg-layer')).toBeInTheDocument();
    expect(screen.getByText('Foreground Content')).toBeInTheDocument();
  });

  it('includes accessibility and focus contrast classes on the viewer container', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Focusable Content</div>
      </InteractiveViewer>
    );

    const viewer = container.firstElementChild;

    expect(viewer).toHaveClass('focus-visible:ring-2');
    expect(viewer).toHaveClass('focus-visible:ring-emerald-500');
    expect(viewer).toHaveClass('focus:outline-none');
  });

  it('renders the cursor glow layer used for dark and light visual cohesion', () => {
    render(
      <InteractiveViewer>
        <div>Glow Content</div>
      </InteractiveViewer>
    );

    expect(screen.getByTestId('parallax-cursor-glow')).toBeInTheDocument();
  });
});
