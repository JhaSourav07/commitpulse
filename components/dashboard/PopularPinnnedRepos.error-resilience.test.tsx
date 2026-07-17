import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PopularRepos } from './PopularPinnnedRepos';

const validRepo = {
  name: 'commitpulse',
  description: 'A dashboard for GitHub stats',
  stargazerCount: 42,
  forkCount: 3,
  url: 'https://github.com/user/commitpulse',
  primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
};

describe('PopularRepos - Error Resilience: Hydration Stability, Exception Safety & Error Fallbacks', () => {
  afterEach(() => {
    cleanup();
  });

  it('1. Hydration stability: produces identical markup across a fresh mount vs. an async data-arrival re-render', () => {
    const { container: fresh } = render(<PopularRepos popularRepos={[validRepo]} />);
    const freshHtml = fresh.innerHTML;
    cleanup();

    // Simulate hydration: first mount with no data (server had none yet), then data "arrives"
    const { rerender, container } = render(<PopularRepos />);
    expect(container.innerHTML).toBe('');
    rerender(<PopularRepos popularRepos={[validRepo]} />);
    expect(container.innerHTML).toBe(freshHtml);
  });

  it('2. Exception safety: repos missing optional fields (description, primaryLanguage) or all-undefined props never throw during render', () => {
    const malformedRepo = { name: 'broken-repo' } as unknown as typeof validRepo;
    const nullLanguageRepo = { ...validRepo, primaryLanguage: null };

    expect(() => render(<PopularRepos popularRepos={[malformedRepo]} />)).not.toThrow();
    cleanup();
    expect(() => render(<PopularRepos popularRepos={[nullLanguageRepo]} />)).not.toThrow();
    cleanup();
    expect(() =>
      render(
        <PopularRepos popularRepos={undefined} pinnedRepos={undefined} starredRepos={undefined} />
      )
    ).not.toThrow();
  });

  it('3. Error fallback: renders the "no repositories found" empty-state instead of crashing when the active view is empty', () => {
    render(<PopularRepos popularRepos={[]} pinnedRepos={[validRepo]} />);
    expect(screen.getByText(/No popular repositories found/i)).toBeInTheDocument();
  });

  it('4. Error fallback: falls back to "No description provided." rather than rendering undefined/null text nodes', () => {
    const repoWithNoDescription = { ...validRepo, description: null };
    render(<PopularRepos popularRepos={[repoWithNoDescription]} />);
    expect(screen.getByText('No description provided.')).toBeInTheDocument();
  });

  it('5. Recovery path: after rendering a repo with missing optional fields, a subsequent render with valid data recovers cleanly (no stuck/stale error state)', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const sparseRepo = { name: 'sparse-repo' } as unknown as typeof validRepo;

    const { rerender } = render(<PopularRepos popularRepos={[sparseRepo]} />);
    expect(screen.getByText('sparse-repo')).toBeInTheDocument();

    rerender(<PopularRepos popularRepos={[validRepo]} />);
    expect(screen.getByText('commitpulse')).toBeInTheDocument();
    expect(screen.queryByText('sparse-repo')).not.toBeInTheDocument();

    consoleError.mockRestore();
  });
});
