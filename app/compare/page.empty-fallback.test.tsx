import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ComparePage, { metadata } from './page';

vi.mock('./CompareClient', () => ({
  default: () => <div data-testid="compare-client">Compare Client</div>,
}));

vi.mock('../components/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

describe('ComparePage empty fallback behavior', () => {
  it('renders safely without crashing', () => {
    expect(() => render(<ComparePage />)).not.toThrow();
  });

  it('renders CompareClient content', () => {
    render(<ComparePage />);

    expect(screen.getByTestId('compare-client')).toBeDefined();
  });

  it('renders Footer component', () => {
    render(<ComparePage />);

    expect(screen.getByTestId('footer')).toBeDefined();
  });

  it('exports valid metadata', () => {
    expect(metadata.title).toBe('Compare | CommitPulse');
  });

  it('contains openGraph fallback metadata', () => {
    expect(metadata.openGraph?.title).toBe('Compare Developers | CommitPulse');
  });
});
