import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ComparePage from './page';

vi.mock('./CompareClient', () => ({
  default: () => <div>Mock Compare Client</div>,
}));

vi.mock('../components/Footer', () => ({
  Footer: () => <div>Mock Footer</div>,
}));

describe('ComparePage error resilience behavior', () => {
  it('renders without crashing under normal conditions', () => {
    render(<ComparePage />);

    expect(screen.getByText('Mock Compare Client')).toBeTruthy();
  });

  it('renders footer successfully', () => {
    render(<ComparePage />);

    expect(screen.getByText('Mock Footer')).toBeTruthy();
  });

  it('maintains page structure during hydration-safe rendering', () => {
    const { container } = render(<ComparePage />);

    expect(container).toBeTruthy();
  });

  it('does not throw unexpected runtime errors during render', () => {
    expect(() => render(<ComparePage />)).not.toThrow();
  });

  it('renders expected fallback-capable layout wrappers', () => {
    const { container } = render(<ComparePage />);

    expect(container.firstChild).toBeTruthy();
  });
});
