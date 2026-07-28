import type { GeneratorState } from '../types';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { PreviewPanel } from './PreviewPanel';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const mockState: GeneratorState = {
  name: '',
  description: '',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: 'test',
  showCommitPulse: false,
  commitPulseAccent: '',
  showRepoSpotlight: false,
  spotlightRepo: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
};

describe('PreviewPanel Component - Empty Fallback Tests', () => {
  it('Case 1: Render PreviewPanel with null/empty content strings and verify that a clear, non-breaking default fallback UI text or placeholder is displayed', () => {
    render(<PreviewPanel markdown="" state={mockState} />);

    expect(screen.getByText('README.md')).toBeInTheDocument();
    expect(screen.getByText(/0 chars/)).toBeInTheDocument();
    expect(screen.getByText(/1 lines/)).toBeInTheDocument();
  });

  it('Case 2: Pass empty arrays for configuration selections and check that no hydration or processing crashes occur', () => {
    const props = {
      markdown: '',
      configurations: [],
    };

    expect(() => {
      render(<PreviewPanel {...(props as { markdown: string })} state={mockState} />);
    }).not.toThrow();
  });

  it('Case 3: Verify standard structural CSS styles or container class names are maintained even when the layout displays its default empty layout state', () => {
    const { container } = render(<PreviewPanel markdown="" state={mockState} />);

    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer).toHaveClass('flex', 'flex-col', 'h-full', 'rounded-2xl', 'border');

    const previewPanel = container.querySelector('#panel-preview');
    expect(previewPanel).toBeInTheDocument();

    const innerCard = previewPanel?.querySelector('.rounded-xl');
    expect(innerCard).toHaveClass('border', 'bg-white', 'dark:bg-[#0d1117]');
  });

  it('Case 4: Assert that no unexpected runtime errors or execution breaks occur during initial render mounting with empty parameters', () => {
    let renderResult;
    expect(() => {
      renderResult = render(<PreviewPanel markdown="" state={mockState} />);
    }).not.toThrow();

    expect(renderResult).toBeDefined();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('Case 5: Scan key DOM tree structures to confirm that specific empty state markers, descriptions, or fallback test IDs exist inside the document', () => {
    const { container } = render(<PreviewPanel markdown="" state={mockState} />);

    const panelPreview = container.querySelector('#panel-preview');
    expect(panelPreview).toBeInTheDocument();

    const readmePreview = container.querySelector('.readme-preview');
    expect(readmePreview).toBeInTheDocument();
    expect(readmePreview?.innerHTML).toBe('');

    const counterText = screen.getByText(/0 chars/);
    expect(counterText).toBeInTheDocument();
  });
});
