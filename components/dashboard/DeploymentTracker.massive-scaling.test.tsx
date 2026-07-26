// DeploymentTracker.massive-scaling.test.tsx
//
// The component hard-caps display to the first 3 items via data.slice(0, 3).
// This suite confirms that cap holds under large inputs, that ordering is
// preserved (no silent sort), and that huge arrays don't blow up render time.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DeploymentTracker from './DeploymentTracker';
import type { DeploymentData } from '@/types/dashboard';

/** Local mock builder, matching this repo's inline-mock convention. */
function makeDeployment(overrides: Partial<DeploymentData> = {}): DeploymentData {
  return {
    repoName: 'acme/web-app',
    repoUrl: 'https://github.com/acme/web-app',
    liveUrl: 'https://web-app.acme.dev',
    status: 'success',
    deployedAt: new Date().toISOString(),
    environment: 'production',
    workflowName: 'Vercel Production Deployment',
    ...overrides,
  };
}

/** Build N deployments, each distinguishable by repoName/index. */
function makeDeployments(
  count: number,
  overrides: (index: number) => Partial<DeploymentData> = () => ({})
): DeploymentData[] {
  return Array.from({ length: count }, (_, i) =>
    makeDeployment({
      repoName: `acme/repo-${i}`,
      repoUrl: `https://github.com/acme/repo-${i}`,
      ...overrides(i),
    })
  );
}

describe('DeploymentTracker — massive scaling', () => {
  it('renders only 3 cards when given 10 deployments', () => {
    render(<DeploymentTracker data={makeDeployments(10)} />);
    expect(screen.getAllByRole('link', { name: /acme\/repo-/i })).toHaveLength(3);
  });

  it('renders only 3 cards when given 1,000 deployments', () => {
    render(<DeploymentTracker data={makeDeployments(1000)} />);
    expect(screen.getAllByRole('link', { name: /acme\/repo-/i })).toHaveLength(3);
  });

  it('preserves input order — shows indices 0, 1, 2 and not a re-sorted subset', () => {
    render(<DeploymentTracker data={makeDeployments(50)} />);
    expect(screen.getByText('acme/repo-0')).toBeInTheDocument();
    expect(screen.getByText('acme/repo-1')).toBeInTheDocument();
    expect(screen.getByText('acme/repo-2')).toBeInTheDocument();
    expect(screen.queryByText('acme/repo-3')).not.toBeInTheDocument();
    expect(screen.queryByText('acme/repo-49')).not.toBeInTheDocument();
  });

  it('renders exactly 1 and 2 cards when given exactly 1 and 2 items (boundary below the cap)', () => {
    const { unmount } = render(<DeploymentTracker data={makeDeployments(1)} />);
    expect(screen.getAllByRole('link', { name: /acme\/repo-/i })).toHaveLength(1);
    unmount();

    render(<DeploymentTracker data={makeDeployments(2)} />);
    expect(screen.getAllByRole('link', { name: /acme\/repo-/i })).toHaveLength(2);
  });

  it('renders exactly 3 cards at the boundary itself (count === 3)', () => {
    render(<DeploymentTracker data={makeDeployments(3)} />);
    expect(screen.getAllByRole('link', { name: /acme\/repo-/i })).toHaveLength(3);
  });

  it('renders within a reasonable time budget for a very large input (10,000 items)', () => {
    const data = makeDeployments(10000);
    const start = performance.now();
    render(<DeploymentTracker data={data} />);
    const elapsed = performance.now() - start;
    // Only 3 are ever displayed, so render time should stay flat regardless of
    // input size — this guards against an accidental full-list render/sort.
    expect(elapsed).toBeLessThan(1000);
    expect(screen.getAllByRole('link', { name: /acme\/repo-/i })).toHaveLength(3);
  });

  it('does not mutate the original array when slicing (slice, not splice)', () => {
    const data = makeDeployments(20);
    const snapshotLength = data.length;
    render(<DeploymentTracker data={data} />);
    expect(data).toHaveLength(snapshotLength);
  });

  it('handles a mixed-status large array, still respecting the 3-item cap', () => {
    const data = makeDeployments(200, (i) => ({
      status: (['success', 'failure', 'in_progress', 'unknown'] as const)[i % 4],
    }));
    render(<DeploymentTracker data={data} />);
    const cards = screen.getAllByRole('link', { name: /acme\/repo-/i });
    expect(cards).toHaveLength(3);
  });
});
