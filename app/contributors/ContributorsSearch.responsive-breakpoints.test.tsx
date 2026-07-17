import { describe, it, expect, vi } from 'vitest';
import React, { type ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ContributorsSearch from './ContributorsSearch';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  ),
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_, tag) =>
        ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) =>
          React.createElement(tag as string, props, children),
    }
  ),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  GitFork: () => <svg data-testid="gitfork-icon" />,
  X: () => <svg data-testid="close-icon" />,
}));

const mockContributors = [
  {
    id: 1,
    login: 'alice',
    avatar_url: 'https://example.com/alice.png',
    contributions: 42,
    html_url: 'https://github.com/alice',
  },
  {
    id: 2,
    login: 'bob',
    avatar_url: 'https://example.com/bob.png',
    contributions: 17,
    html_url: 'https://github.com/bob',
  },
];

describe('ContributorsSearch Responsive Breakpoints & Mobile Viewports', () => {
  it('1. Mocks standard mobile-width media coordinates and renders without crashing', () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    window.dispatchEvent(new Event('resize'));

    render(<ContributorsSearch contributors={mockContributors} />);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth,
    });
  });

  it('2. Asserts that columns reflow into standard single-column grids on mobile', () => {
    const { container } = render(<ContributorsSearch contributors={mockContributors} />);
    const gridContainer = container.querySelector('.grid');

    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('sm:grid-cols-2');
    expect(gridContainer).toHaveClass('lg:grid-cols-3');
    expect(gridContainer).toHaveClass('xl:grid-cols-4');
  });

  it('3. Verifies that styling values are not absolute widths that cause horizontal scrollbars', () => {
    const { container } = render(<ContributorsSearch contributors={mockContributors} />);
    const elementsWithClass = container.querySelectorAll('[class]');

    elementsWithClass.forEach((el) => {
      const className = el.getAttribute('class') || '';
      expect(className).not.toMatch(/\bw-\[\d+px\]/);
    });
  });

  it('4. Checks that navigation & input elements scale down gracefully using relative widths', () => {
    const { container } = render(<ContributorsSearch contributors={mockContributors} />);

    const searchContainer = container.querySelector('#contributors');
    expect(searchContainer).toBeInTheDocument();
    expect(searchContainer).toHaveClass('max-w-xl');
    expect(searchContainer).toHaveClass('mx-auto');

    const searchInput = screen.getByPlaceholderText(/Search the collective.../i);
    expect(searchInput).toHaveClass('w-full');
  });

  it('5. Asserts mobile-friendly search toggle and clear state responds cleanly', () => {
    render(<ContributorsSearch contributors={mockContributors} />);

    expect(screen.queryByLabelText(/Clear search/i)).toBeNull();

    const searchInput = screen.getByPlaceholderText(
      /Search the collective.../i
    ) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    const clearButton = screen.getByLabelText(/Clear search/i);
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(searchInput.value).toBe('');
    expect(screen.queryByLabelText(/Clear search/i)).toBeNull();
  });
});
