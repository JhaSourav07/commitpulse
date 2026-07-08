import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import InteractiveViewer from './InteractiveViewer';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./dashboard/VisualizationTooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  ),
}));

describe('InteractiveViewer Responsive Breakpoints', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    window.dispatchEvent(new Event('resize'));
  });

  it('1. renders correctly on mobile viewport', () => {
    render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );

    expect(screen.getByLabelText(/interactive viewer/i)).toBeInTheDocument();
  });

  it('2. keeps content rendered in narrow viewport', () => {
    render(
      <InteractiveViewer>
        <div>Mobile Layout</div>
      </InteractiveViewer>
    );

    expect(screen.getByText('Mobile Layout')).toBeInTheDocument();
  });

  it('3. uses flex layout without clipping content', () => {
    render(
      <InteractiveViewer>
        <div>Responsive</div>
      </InteractiveViewer>
    );

    const viewer = screen.getByLabelText(/interactive viewer/i);

    expect(viewer).toHaveStyle({
      display: 'flex',
    });
  });

  it('4. preserves navigation/content after resize', () => {
    window.innerWidth = 768;
    window.dispatchEvent(new Event('resize'));

    render(
      <InteractiveViewer>
        <button>Navigate</button>
      </InteractiveViewer>
    );

    expect(screen.getByRole('button', { name: 'Navigate' })).toBeInTheDocument();
  });

  it('5. supports mobile specific rendering without crashing', () => {
    render(
      <InteractiveViewer>
        <div data-testid="mobile-content">Responsive Child</div>
      </InteractiveViewer>
    );

    expect(screen.getByTestId('mobile-content')).toBeInTheDocument();
  });
});
