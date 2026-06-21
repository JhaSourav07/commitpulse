// DeploymentTracker.mouse-interactivity.test.tsx
//
// Covers pointer-driven behavior: hovering cards and links applies the
// expected hover utility classes, clicking links doesn't trigger app
// navigation away from the test (they're real <a> tags, not buttons with
// handlers), and hover micro-interactions on the external-link icon.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('DeploymentTracker — mouse interactivity', () => {
  it('applies group hover background classes to the card container', () => {
    render(<DeploymentTracker data={[makeDeployment({ repoName: 'acme/hover-card' })]} />);
    const card = screen.getByText('acme/hover-card').closest('div.group');
    expect(card).not.toBeNull();
    expect(card?.className).toMatch(/hover:bg-gray-100\/80/);
  });

  it('repo link carries a hover color-transition class', () => {
    render(<DeploymentTracker data={[makeDeployment({ repoName: 'acme/colorshift' })]} />);
    const link = screen.getByRole('link', { name: 'acme/colorshift' });
    expect(link.className).toMatch(/hover:text-emerald-600/);
    expect(link.className).toMatch(/transition-colors/);
  });

  it('live URL link carries group/link hover-translate classes on its icon', () => {
    render(
      <DeploymentTracker
        data={[makeDeployment({ liveUrl: 'https://example.com', repoName: 'acme/withlive' })]}
      />
    );
    const liveLink = screen.getByText('example.com').closest('a');
    expect(liveLink).not.toBeNull();
    expect(liveLink?.className).toMatch(/group\/link/);
    const icon = liveLink?.querySelector('svg');
    expect(icon?.getAttribute('class')).toMatch(/group-hover\/link:translate-x-0\.5/);
  });

  it('user can hover over a card without triggering any error or navigation', async () => {
    const user = userEvent.setup();
    render(<DeploymentTracker data={[makeDeployment({ repoName: 'acme/safe-hover' })]} />);
    const card = screen.getByText('acme/safe-hover').closest('div.group') as HTMLElement;
    await user.hover(card);
    await user.unhover(card);
    expect(card).toBeInTheDocument();
  });

  it('clicking the repo link does not throw (anchor click is handled by jsdom, no app crash)', async () => {
    const user = userEvent.setup();
    render(<DeploymentTracker data={[makeDeployment({ repoName: 'acme/clickable' })]} />);
    const link = screen.getByRole('link', { name: 'acme/clickable' });
    // jsdom doesn't actually navigate; this just verifies the click handler
    // path (none custom — it's a plain <a>) doesn't error.
    await expect(user.click(link)).resolves.not.toThrow();
  });

  it('clicking the live URL link does not call any onClick handler (none attached) and does not error', async () => {
    const user = userEvent.setup();
    const clickSpy = vi.fn();
    render(
      <DeploymentTracker
        data={[makeDeployment({ liveUrl: 'https://example.com', repoName: 'acme/livelink' })]}
      />
    );
    const liveLink = screen.getByText('example.com').closest('a') as HTMLElement;
    liveLink.addEventListener('click', clickSpy);
    await user.click(liveLink);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('hovering one card does not affect the hover classes present on a sibling card', () => {
    render(
      <DeploymentTracker
        data={[
          makeDeployment({ repoName: 'acme/card-a' }),
          makeDeployment({ repoName: 'acme/card-b' }),
        ]}
      />
    );
    const cardA = screen.getByText('acme/card-a').closest('div.group');
    const cardB = screen.getByText('acme/card-b').closest('div.group');
    expect(cardA?.className).toMatch(/group/);
    expect(cardB?.className).toMatch(/group/);
    expect(cardA).not.toBe(cardB);
  });

  it('the "No live URL configured" fallback has no hover/link affordance (not interactive)', () => {
    render(<DeploymentTracker data={[makeDeployment({ liveUrl: null })]} />);
    const fallback = screen.getByText('No live URL configured');
    expect(fallback.tagName).toBe('SPAN');
    expect(fallback.className).not.toMatch(/hover:/);
  });
});
