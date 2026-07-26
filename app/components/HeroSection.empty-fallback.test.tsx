import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { HeroSection } from './HeroSection';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    section: 'section',
    h1: 'h1',
    p: 'p',
  },
}));

describe('HeroSection - Edge Cases & Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Case 1: mounts successfully and renders initial empty states/headings', () => {
    render(<HeroSection />);

    // Verify region role and label
    const heroRegion = screen.getByRole('region', { name: /Hero section/i });
    expect(heroRegion).toBeInTheDocument();

    // Verify main headings are rendered
    expect(screen.getByRole('heading', { level: 1, name: /Elevate Your/i })).toBeInTheDocument();
    expect(screen.getByText(/Story/i)).toBeInTheDocument();
  });

  it('Case 2: starts with an empty search input field and displays placeholder text as fallback', () => {
    render(<HeroSection />);

    // Input field should be initially completely empty
    const input = screen.getByPlaceholderText(/Enter GitHub Username/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('');

    // Search role container
    expect(
      screen.getByRole('search', { name: /Generate your GitHub streak badge/i })
    ).toBeInTheDocument();
  });

  it('Case 3: maintains responsive background gradients and default alignment styling classes', () => {
    const { container } = render(<HeroSection />);
    const root = container.firstElementChild as HTMLElement;

    // Check style wrapper contains alignment and background classes
    expect(root).toHaveClass('relative');
    expect(root).toHaveClass('text-center');
    expect(root).toHaveClass('overflow-hidden');
    expect(root).toHaveClass(
      'bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.04),transparent_70%)]'
    );
  });

  it('Case 4: renders all three stat badges with their standard boundary options', () => {
    render(<HeroSection />);

    const contributions = screen.getByText(/1,247 Contributions/i);
    const prs = screen.getByText(/83 Pull Requests/i);
    const commits = screen.getByText(/214 Commits/i);

    expect(contributions).toBeInTheDocument();
    expect(prs).toBeInTheDocument();
    expect(commits).toBeInTheDocument();

    expect(contributions).toHaveClass('border-green-500/20');
    expect(prs).toHaveClass('border-cyan-500/20');
    expect(commits).toHaveClass('border-purple-500/20');
  });

  it('Case 5: operates cleanly without crashes under empty mock animation layouts', () => {
    // Emulating the grid of pulsing dot elements
    const { container } = render(<HeroSection />);

    // Checks that the dots container with grid layouts mounts correctly
    const dotsContainer = container.querySelector('.grid-cols-6');
    expect(dotsContainer).toBeInTheDocument();
    expect(dotsContainer?.children.length).toBe(24);

    // Default action buttons should exist
    expect(screen.getByRole('button', { name: /Copy Link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Watch Dashboard/i })).toBeInTheDocument();
  });
});
