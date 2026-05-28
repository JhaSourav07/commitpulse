import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InteractiveViewer from './InteractiveViewer';

describe('InteractiveViewer', () => {
  it('renders children correctly', () => {
    render(
      <InteractiveViewer>
        <div data-testid="child">Test Child</div>
      </InteractiveViewer>
    );
    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('handles keyboard navigation for panning', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;

    // Focus and press 'w' to pan up
    fireEvent.keyDown(viewerContainer, { key: 'w' });

    // Check if the transform style was updated on the inner div
    const innerDiv = viewerContainer.firstChild as HTMLElement;
    expect(innerDiv.style.transform).toContain('translate(0px, 30px) scale(1)');
  });

  it('handles keyboard navigation for zooming', () => {
    const { container } = render(
      <InteractiveViewer>
        <div>Content</div>
      </InteractiveViewer>
    );
    const viewerContainer = container.firstChild as HTMLElement;

    // Focus and press '+' to zoom in
    fireEvent.keyDown(viewerContainer, { key: '+' });

    // Check if the transform style was updated on the inner div
    const innerDiv = viewerContainer.firstChild as HTMLElement;
    expect(innerDiv.style.transform).toContain('scale(1.1)');
  });

  it('ignores key presses if an input element is focused', () => {
    render(
      <InteractiveViewer>
        <input data-testid="input" />
      </InteractiveViewer>
    );

    const input = screen.getByTestId('input');
    input.focus();

    const viewerContainer = input.parentElement?.parentElement as HTMLElement;
    fireEvent.keyDown(viewerContainer, { key: 'w' });

    const innerDiv = viewerContainer.firstChild as HTMLElement;
    // Should not have panned
    expect(innerDiv.style.transform).toContain('translate(0px, 0px) scale(1)');
  });
});
