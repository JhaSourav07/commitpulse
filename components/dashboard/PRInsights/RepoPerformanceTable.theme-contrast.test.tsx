import { render, screen } from '@testing-library/react';
import RepoPerformanceTable from './RepoPerformanceTable';
import { describe, expect, it } from 'vitest';

const mockData = {
  repoPerformance: [
    {
      name: 'owner/test-repo',
      totalPRs: 25,
      mergeRate: 80,
      reviewCount: 15,
    },
  ],
};

describe('RepoPerformanceTable Theme Contrast', () => {
  it('renders light theme styling classes', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { container } = render(<RepoPerformanceTable data={mockData as any} />);

    const heading = screen.getByText('Repository Performance');
    expect(heading.className).toContain('text-gray-900');
    expect(heading.className).toContain('dark:text-white');

    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('bg-white');
  });

  it('includes dark theme styling classes', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { container } = render(<RepoPerformanceTable data={mockData as any} />);

    const root = container.firstChild as HTMLElement;

    expect(root.className).toContain('dark:bg-zinc-900/50');
    expect(root.className).toContain('dark:border-white/10');
  });

  it('maintains readable repository text contrast', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<RepoPerformanceTable data={mockData as any} />);

    const repoName = screen.getByText('test-repo');

    expect(repoName.className).toContain('text-gray-900');
    expect(repoName.className).toContain('dark:text-white');
  });

  it('maintains readable metrics contrast', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<RepoPerformanceTable data={mockData as any} />);

    const mergeRate = screen.getByText('80%');

    expect(mergeRate.className).toContain('text-gray-700');
    expect(mergeRate.className).toContain('dark:text-gray-300');
  });

  it('keeps table content visible and accessible', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<RepoPerformanceTable data={mockData as any} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Repository')).toBeInTheDocument();
    expect(screen.getByText('PRs')).toBeInTheDocument();
    expect(screen.getByText('Merge Rate')).toBeInTheDocument();
    expect(screen.getByText('Reviews')).toBeInTheDocument();
  });
});
