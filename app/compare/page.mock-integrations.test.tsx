import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./CompareClient', () => ({
  default: () => <div>Mock Compare Client</div>,
}));

vi.mock('../components/Footer', () => ({
  Footer: () => <div>Mock Footer</div>,
}));

import ComparePage from './page';

describe('ComparePage mock integrations', () => {
  it('renders CompareClient through mocked service layer', () => {
    render(<ComparePage />);

    expect(screen.getByText('Mock Compare Client')).toBeInTheDocument();
  });

  it('renders Footer component', () => {
    render(<ComparePage />);

    expect(screen.getByText('Mock Footer')).toBeInTheDocument();
  });

  it('renders CompareClient only once', () => {
    render(<ComparePage />);

    expect(screen.getAllByText('Mock Compare Client')).toHaveLength(1);
  });

  it('renders Footer only once', () => {
    render(<ComparePage />);

    expect(screen.getAllByText('Mock Footer')).toHaveLength(1);
  });

  it('renders page layout with both mocked integrations', () => {
    render(<ComparePage />);

    expect(screen.getByText('Mock Compare Client')).toBeInTheDocument();
    expect(screen.getByText('Mock Footer')).toBeInTheDocument();
  });
});
