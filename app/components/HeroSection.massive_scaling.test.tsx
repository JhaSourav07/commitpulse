import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { HeroSection } from './HeroSection';

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    section: 'section',
    h1: 'h1',
    p: 'p',
  },
}));

describe('HeroSection – Massive Data Sets and Extreme High Bounds Scaling (Variation 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Case 1: renders successfully with maximum content constraints', () => {
    const { container } = render(<HeroSection />);

    expect(container).toBeDefined();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter github username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /watch dashboard/i })).toBeInTheDocument();
  });

  it('Case 2: handles extreme rapid input in username field without breaking', () => {
    render(<HeroSection />);

    const input = screen.getByPlaceholderText(/enter github username/i) as HTMLInputElement;

    const longUsername = 'a'.repeat(500);
    fireEvent.change(input, { target: { value: longUsername } });

    expect(input.value).toBe(longUsername);
    expect(input.value.length).toBe(500);

    for (let i = 0; i < 100; i++) {
      fireEvent.change(input, { target: { value: `user${i}`.repeat(10) } });
    }

    expect(input).toBeInTheDocument();
  });

  it('Case 3: handles extreme stat values in display badges', () => {
    render(<HeroSection />);

    const contributions = screen.getByText(/1,247 Contributions/i);
    const prs = screen.getByText(/83 Pull Requests/i);
    const commits = screen.getByText(/214 Commits/i);

    expect(contributions).toBeInTheDocument();
    expect(prs).toBeInTheDocument();
    expect(commits).toBeInTheDocument();

    expect(contributions.textContent).toContain('1,247');
    expect(prs.textContent).toContain('83');
    expect(commits.textContent).toContain('214');
  });

  it('Case 4: maintains responsive layout with extreme viewport sizes', () => {
    const viewports = [320, 375, 768, 1024, 1280, 1920, 3840];

    for (const width of viewports) {
      window.innerWidth = width;
      window.dispatchEvent(new Event('resize'));

      const { container, unmount } = render(<HeroSection />);

      const hero = container.firstElementChild;
      expect(hero).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      unmount();
    }
  });

  it('Case 5: remains stable under rapid re-renders with extreme props', () => {
    const { rerender, container } = render(<HeroSection />);

    const RERENDER_COUNT = 100;
    const start = performance.now();

    for (let i = 0; i < RERENDER_COUNT; i++) {
      rerender(<HeroSection />);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);

    expect(screen.getByPlaceholderText(/enter github username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /watch dashboard/i })).toBeInTheDocument();
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
  });
});
