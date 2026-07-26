import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('NotFound', () => {
  it('renders without crashing', () => {
    render(<NotFound />);

    expect(document.body).toBeTruthy();
  });

  it('renders the oops text', () => {
    render(<NotFound />);

    expect(screen.getAllByText('404')).toHaveLength(3);
  });

  it('renders git checkout main text', () => {
    render(<NotFound />);

    expect(screen.getByText(/git checkout main/i)).toBeTruthy();
  });

  it('renders go back home link with root href', () => {
    render(<NotFound />);

    const homeLink = screen.getByRole('link', {
      name: /go back home/i,
    });

    expect(homeLink.getAttribute('href')).toBe('/');
  });

  it('renders github link pointing to commitpulse repository', () => {
    render(<NotFound />);

    const githubLink = screen.getByRole('link', {
      name: /git checkout main/i,
    });

    expect(githubLink.getAttribute('href')).toContain('github.com');
    expect(githubLink.getAttribute('href')).toContain('commitpulse');
  });
});
