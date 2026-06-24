// DeploymentTracker.empty-fallback.test.tsx
//
// Covers the component's "nothing to show" and per-field fallback paths:
// no data array, empty array, undefined prop, null deployedAt, null liveUrl,
// and unrecognized status values falling back to the "unknown" badge.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DeploymentTracker from './DeploymentTracker';
import type { DeploymentData, WorkflowStatus } from '@/types/dashboard';

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

describe('DeploymentTracker — empty & fallback states', () => {
  it('renders nothing when data is undefined (uses default prop)', () => {
    // Removed the unused @ts-expect-error directive because data is optional on the interface
    const { container } = render(<DeploymentTracker />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when data is an empty array', () => {
    const { container } = render(<DeploymentTracker data={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when data is explicitly null-ish at runtime', () => {
    // Simulates an API response that resolved to null despite the TS type.
    const { container } = render(<DeploymentTracker data={null as unknown as undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows "No live URL configured" italic fallback when liveUrl is null', () => {
    render(<DeploymentTracker data={[makeDeployment({ liveUrl: null })]} />);
    const fallback = screen.getByText('No live URL configured');
    expect(fallback).toBeInTheDocument();
    expect(fallback.className).toMatch(/italic/);
  });

  it('does not render the fallback text when liveUrl is present', () => {
    render(<DeploymentTracker data={[makeDeployment({ liveUrl: 'https://example.com' })]} />);
    expect(screen.queryByText('No live URL configured')).not.toBeInTheDocument();
  });

  it('shows "Deployed Unknown" when deployedAt is null', () => {
    render(<DeploymentTracker data={[makeDeployment({ deployedAt: null })]} />);
    expect(screen.getByText('Deployed Unknown')).toBeInTheDocument();
  });

  it('shows "Deployed Unknown" when deployedAt is an unparsable string', () => {
    render(<DeploymentTracker data={[makeDeployment({ deployedAt: 'not-a-real-date' })]} />);
    expect(screen.getByText('Deployed Unknown')).toBeInTheDocument();
  });

  it('falls back to the "Unknown" status badge for a status value outside the known union', () => {
    // workflowName/status could come from an upstream API drifting from the TS contract.
    const weirdStatus = 'queued' as unknown as WorkflowStatus;
    render(<DeploymentTracker data={[makeDeployment({ status: weirdStatus })]} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('renders an empty environment string without crashing', () => {
    render(<DeploymentTracker data={[makeDeployment({ environment: '' })]} />);
    expect(screen.getByText(/deployed/i)).toBeInTheDocument();
  });

  it('handles workflowName being null without affecting the rendered card (field is not displayed)', () => {
    render(<DeploymentTracker data={[makeDeployment({ workflowName: null })]} />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('handles an empty repoName gracefully (renders an empty but present link)', () => {
    render(<DeploymentTracker data={[makeDeployment({ repoName: '' })]} />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', 'https://github.com/acme/web-app');
  });
});
