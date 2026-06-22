// DeploymentTracker.accessibility.test.tsx
//
// Verifies the component exposes a sane accessibility tree: meaningful link
// text (not just icons), correct use of external-link attributes, heading
// semantics, and that status information isn't conveyed by color alone.

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

describe('DeploymentTracker — accessibility', () => {
  it('renders a heading that names the section', () => {
    render(<DeploymentTracker data={[makeDeployment()]} />);
    // The component uses an <h3>; jsdom still exposes it with the "heading" role.
    const heading = screen.getByRole('heading', { name: /production deployments/i });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H3');
  });

  it('exposes the repo link with accessible, non-empty text', () => {
    render(
      <DeploymentTracker
        data={[
          makeDeployment({
            repoName: 'acme/api-gateway',
            repoUrl: 'https://github.com/acme/api-gateway',
          }),
        ]}
      />
    );
    const link = screen.getByRole('link', { name: 'acme/api-gateway' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/acme/api-gateway');
  });

  it('sets target and rel="noopener noreferrer" on every external link', () => {
    render(
      <DeploymentTracker
        data={[
          makeDeployment({
            repoUrl: 'https://github.com/acme/web-app',
            liveUrl: 'https://web-app.acme.dev',
          }),
        ]}
      />
    );
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('gives the repo link a title attribute for assistive tech / truncation', () => {
    render(<DeploymentTracker data={[makeDeployment({ repoName: 'acme/very-long-repo-name' })]} />);
    const link = screen.getByRole('link', { name: 'acme/very-long-repo-name' });
    expect(link).toHaveAttribute('title', 'acme/very-long-repo-name');
  });

  it('does not rely on color alone to convey status — each badge has a text label', () => {
    render(
      <DeploymentTracker
        data={[
          makeDeployment({ repoName: 'r1', status: 'success' }),
          makeDeployment({ repoName: 'r2', status: 'failure' }),
        ]}
      />
    );
    // Text labels accompany the colored dot for every status.
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it("keeps each deployment card's content groupable for screen readers via accessible name on its link", () => {
    render(
      <DeploymentTracker
        data={[
          makeDeployment({ repoName: 'acme/svc-one' }),
          makeDeployment({ repoName: 'acme/svc-two' }),
        ]}
      />
    );
    const svcOne = screen.getByRole('link', { name: 'acme/svc-one' });
    const svcTwo = screen.getByRole('link', { name: 'acme/svc-two' });
    expect(svcOne).toBeInTheDocument();
    expect(svcTwo).toBeInTheDocument();
  });

  it('"No live URL configured" fallback is plain text, not a dead/empty link', () => {
    render(<DeploymentTracker data={[makeDeployment({ liveUrl: null })]} />);
    const fallback = screen.getByText('No live URL configured');
    expect(fallback.tagName).not.toBe('A');
    // Confirms there is exactly one link on the card (the repo link), not a broken live-url link.
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('icons used purely for decoration do not introduce extra accessible names', () => {
    const { container } = render(<DeploymentTracker data={[makeDeployment()]} />);
    // lucide-react icons render as <svg>; they should not carry role="img" with
    // a competing accessible name that would duplicate/clutter the link's name.
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) {
      expect(svg).not.toHaveAttribute('role', 'img');
    }
  });

  it('renders nothing (no stray landmarks) when there is no data, rather than an empty shell', () => {
    const { container } = render(<DeploymentTracker data={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps environment + timestamp readable as plain text within each card', () => {
    render(<DeploymentTracker data={[makeDeployment({ environment: 'staging' })]} />);
    const card = screen.getByText('staging').closest('div');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText(/deployed/i)).toBeInTheDocument();
  });
});
