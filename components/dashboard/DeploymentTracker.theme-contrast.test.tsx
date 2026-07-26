// DeploymentTracker.theme-contrast.test.tsx
//
// Verifies every themed surface (card background, borders, badges) ships
// both a light-mode class and a corresponding dark: variant, so nothing goes
// invisible or low-contrast when the app's dark mode is toggled. Since
// Tailwind dark: classes are just class names (no actual media/class-based
// switching happens in jsdom), this suite asserts presence of the class
// pairs rather than rendered computed color.

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

describe('DeploymentTracker — theme & contrast', () => {
  it('root container has both a light and dark background class', () => {
    const { container } = render(<DeploymentTracker data={[makeDeployment()]} />);
    const root = container.firstElementChild;
    expect(root?.className).toMatch(/\bbg-white\b/);
    expect(root?.className).toMatch(/dark:bg-\[#0a0a0a\]/);
  });

  it('root container border has both a light and dark variant', () => {
    const { container } = render(<DeploymentTracker data={[makeDeployment()]} />);
    const root = container.firstElementChild;
    expect(root?.className).toMatch(/border-black\/10/);
    expect(root?.className).toMatch(/dark:border-\[rgba\(255,255,255,0\.08\)\]/);
  });

  it('heading text is dark-on-light and light-on-dark', () => {
    render(<DeploymentTracker data={[makeDeployment()]} />);
    const heading = screen.getByRole('heading', { name: /production deployments/i });
    expect(heading.className).toMatch(/text-gray-900/);
    expect(heading.className).toMatch(/dark:text-white/);
  });

  it('card surface has paired light/dark background classes', () => {
    render(<DeploymentTracker data={[makeDeployment({ repoName: 'acme/themecard' })]} />);
    const card = screen.getByText('acme/themecard').closest('div.group');
    expect(card?.className).toMatch(/bg-gray-50\/50/);
    expect(card?.className).toMatch(/dark:bg-neutral-900\/30/);
  });

  it.each<[WorkflowStatus, string]>([
    ['success', 'Success'],
    ['failure', 'Failed'],
    ['in_progress', 'In Progress'],
    ['unknown', 'Unknown'],
  ])(
    'status "%s" badge has a dark-mode text-color variant alongside the light one',
    (status, label) => {
      render(<DeploymentTracker data={[makeDeployment({ status, repoName: `acme/${status}` })]} />);
      const badge = screen.getByText(label).closest('span');
      expect(badge?.className).toMatch(/dark:text-/);
      expect(badge?.className).toMatch(/text-\S+-700|text-\S+-600|text-gray-600/);
    }
  );

  it.each<WorkflowStatus>(['success', 'failure', 'in_progress', 'unknown'])(
    'status "%s" badge background has a dark-mode variant',
    (status) => {
      render(
        <DeploymentTracker data={[makeDeployment({ status, repoName: `acme/bg-${status}` })]} />
      );
      const label = {
        success: 'Success',
        failure: 'Failed',
        in_progress: 'In Progress',
        unknown: 'Unknown',
      }[status];
      const badge = screen.getByText(label).closest('span');
      expect(badge?.className).toMatch(/dark:bg-/);
    }
  );

  it('the colored status dot itself does not change between themes (intentional — same hue both modes)', () => {
    render(
      <DeploymentTracker
        data={[makeDeployment({ status: 'failure', repoName: 'acme/dotcheck' })]}
      />
    );
    const badge = screen.getByText('Failed').closest('span');
    const dot = badge?.querySelector('span.relative span:last-child');
    expect(dot?.className).toMatch(/bg-red-500/);
    // No dark: variant expected on the literal dot color — confirms it's a
    // deliberate fixed-hue choice, not a missed theming spot.
    expect(dot?.className).not.toMatch(/dark:bg-red/);
  });

  it('muted/secondary text (timestamp, environment label) carries dark variants', () => {
    render(
      <DeploymentTracker
        data={[makeDeployment({ environment: 'production', repoName: 'acme/muted' })]}
      />
    );
    const envLabel = screen.getByText('production');
    expect(envLabel.className).toMatch(/text-gray-400/);
    expect(envLabel.className).toMatch(/dark:text-zinc-500/);
  });

  it('"No live URL configured" fallback text has a dark-mode color variant', () => {
    render(<DeploymentTracker data={[makeDeployment({ liveUrl: null })]} />);
    const fallback = screen.getByText('No live URL configured');
    expect(fallback.className).toMatch(/text-gray-400/);
    expect(fallback.className).toMatch(/dark:text-zinc-600/);
  });

  it('card border has both light and dark ring/border classes for visibility in either mode', () => {
    render(<DeploymentTracker data={[makeDeployment({ repoName: 'acme/border-check' })]} />);
    const card = screen.getByText('acme/border-check').closest('div.group');
    expect(card?.className).toMatch(/border-gray-200\/60/);
    expect(card?.className).toMatch(/dark:border-neutral-800\/60/);
  });
});
