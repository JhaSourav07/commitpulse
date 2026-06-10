import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import ShareButtons from './ShareButtons';
import React from 'react';

describe('ShareButtons - Massive Data Sets & Extreme Scaling', () => {
  it('renders successfully with extremely large URL inputs', () => {
    const hugeUrl = 'https://example.com/' + 'a'.repeat(50000);

    expect(() => render(<ShareButtons url={hugeUrl} />)).not.toThrow();
  });

  it('renders successfully with extremely large title inputs', () => {
    const hugeTitle = 'Contribution '.repeat(5000);

    render(<ShareButtons url="https://example.com" title={hugeTitle} />);

    expect(screen.getByLabelText(/Share on X/i)).toBeInTheDocument();
  });

  it('generates valid sharing links under extreme payload sizes', () => {
    const hugeTitle = 'Metric '.repeat(3000);

    render(<ShareButtons url="https://example.com" title={hugeTitle} />);

    const twitterButton = screen.getByLabelText(/Share on X/i);

    expect(twitterButton).toHaveAttribute('href');
    expect(twitterButton.getAttribute('href')?.length).toBeGreaterThan(1000);
  });

  it('maintains layout container structure under high input volume', () => {
    const hugeUrl = 'https://example.com/' + 'x'.repeat(25000);

    render(<ShareButtons url={hugeUrl} />);

    const container = screen.getByLabelText(/Share on X/i).parentElement;

    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('gap-3');
  });

  it('renders both share actions without layout degradation at extreme scale', () => {
    const hugeUrl = 'https://example.com/' + 'z'.repeat(50000);
    const hugeTitle = 'Activity '.repeat(5000);

    render(<ShareButtons url={hugeUrl} title={hugeTitle} />);

    expect(screen.getByLabelText(/Share on LinkedIn/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Share on X/i)).toBeInTheDocument();
  });
});
