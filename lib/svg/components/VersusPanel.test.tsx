import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
// Assuming the user provides or will provide the component:
import { VersusPanel } from './VersusPanel';

describe('VersusPanel Unit Tests', () => {
  const defaultProps = {
    user1: 'alice',
    user2: 'bob',
    isWinner1: false,
    isWinner2: false,
    isTied: false,
    singleW: 800,
    H: 400,
    sf: 1,
    towers1: '<g id="towers1"></g>',
    towers2: '<g id="towers2"></g>',
    labels1: '<g id="labels1"></g>',
    labels2: '<g id="labels2"></g>',
    stats1Html: '<g id="stats1"></g>',
    stats2Html: '<g id="stats2"></g>',
    accent: '#00ffaa',
    text: '#ffffff',
    statsFont: 'sans-serif',
    bg: '#0d1117',
  };

  it('Symmetric Layout Bounds: renders with proportional bounding boundaries', () => {
    const markup = renderToStaticMarkup(<VersusPanel {...defaultProps} />);
    expect(markup).toContain('translate(0, 0)');
    expect(markup).toContain('translate(800, 0)');
    expect(markup).toContain('translate(800, 200)');
    expect(markup).toContain('x1="800"'); // Center divider
  });

  it('Username and Crown Decoration Handling: winner gets a crown', () => {
    const props = { ...defaultProps, isWinner1: true, isWinner2: false };
    const markup = renderToStaticMarkup(<VersusPanel {...props} />);
    expect(markup).toContain('ALICE 👑');
    expect(markup).not.toContain('BOB 👑');
    expect(markup).toContain('BOB');
  });

  it('Username and Crown Decoration Handling: flat on a tied state', () => {
    const props = { ...defaultProps, isWinner1: true, isWinner2: true, isTied: true };
    const markup = renderToStaticMarkup(<VersusPanel {...props} />);
    expect(markup).not.toContain('👑');
    expect(markup).toContain('ALICE');
    expect(markup).toContain('BOB');
  });

  it('Escaping Vectors: handles XML-reserved special characters safely', () => {
    const props = { ...defaultProps, user1: '<xml>', user2: 'a & b' };
    const markup = renderToStaticMarkup(<VersusPanel {...props} />);
    expect(markup).toContain('&lt;XML&gt;');
    expect(markup).toContain('A &amp; B');
    expect(markup).not.toContain('<xml>');
  });
});
