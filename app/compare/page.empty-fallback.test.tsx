import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// 1. Import generateMetadata instead of metadata
import ComparePage, { generateMetadata } from './page';

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

  // 2. Update to async tests that call generateMetadata
  it('exports valid metadata', async () => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({}) });
    expect(metadata.title).toBe('Compare Developers | CommitPulse');
  });

  it('contains openGraph fallback metadata', async () => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({}) });
    expect(metadata.openGraph?.title).toBe('Compare Developers | CommitPulse');
  });
});
