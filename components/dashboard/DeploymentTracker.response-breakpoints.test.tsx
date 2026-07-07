// DeploymentTracker.response-breakpoints.test.tsx
//
// This component doesn't use responsive (sm:/md:/lg:) Tailwind variants —
// it's a single fixed-width-friendly column (`w-full`) meant to sit inside a
// dashboard grid cell. This suite verifies the layout-critical classes that
// make it behave correctly at any container width (truncation, flex-wrap
// behavior, min-w-0 for text overflow) and confirms it renders identically
// regardless of viewport size, since responsiveness here is the parent
// grid's job, not this component's.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

describe('DeploymentTracker — responsive breakpoints', () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    setViewportWidth(1280);
  });

  afterEach(() => {
    setViewportWidth(originalWidth);
  });

  it('root container is full-width so it fills whatever grid cell it sits in', () => {
    const { container } = render(<DeploymentTracker data={[makeDeployment()]} />);
    const root = container.firstElementChild;
    expect(root?.className).toMatch(/\bw-full\b/);
  });

  it('repo name has truncate + min-w-0 on its wrapper so long names clip instead of breaking layout', () => {
    render(
      <DeploymentTracker
        data={[makeDeployment({ repoName: 'acme/extremely-long-repository-name-here' })]}
      />
    );
    const link = screen.getByRole('link', { name: /extremely-long-repository-name-here/i });
    expect(link.className).toMatch(/truncate/);
    const headerRow = link.closest('div.flex.items-center');
    expect(headerRow?.className).toMatch(/min-w-0/);
  });

  it('the title/status header row uses justify-between with no-wrap-shrink guards so the badge never gets pushed off', () => {
    render(<DeploymentTracker data={[makeDeployment({ repoName: 'acme/narrow-test' })]} />);
    const headerRow = screen.getByText('acme/narrow-test').closest('div.flex.items-start');
    expect(headerRow?.className).toMatch(/justify-between/);
    const icon = headerRow?.querySelector('svg');
    expect(icon?.getAttribute('class')).toMatch(/flex-shrink-0/);
  });

  it('renders identically at a simulated narrow (mobile) viewport width — no crash, same content', () => {
    setViewportWidth(360);
    render(<DeploymentTracker data={[makeDeployment({ repoName: 'acme/mobile-check' })]} />);
    expect(screen.getByText('acme/mobile-check')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('renders identically at a simulated wide (ultra-wide desktop) viewport width', () => {
    setViewportWidth(2560);
    render(<DeploymentTracker data={[makeDeployment({ repoName: 'acme/wide-check' })]} />);
    expect(screen.getByText('acme/wide-check')).toBeInTheDocument();
  });

  it('the live-url row truncates long URLs rather than wrapping and breaking card height', () => {
    const longUrl = 'https://' + 'sub.'.repeat(15) + 'example.com';
    render(
      <DeploymentTracker data={[makeDeployment({ liveUrl: longUrl, repoName: 'acme/longurl' })]} />
    );
    const displayed = longUrl.replace(/^https?:\/\//, '');
    const span = screen.getByText(displayed);
    expect(span.className).toMatch(/truncate/);
  });

  it('footer row (environment + timestamp) stays a flex row with justify-between regardless of content length', () => {
    render(
      <DeploymentTracker
        data={[
          makeDeployment({ environment: 'production-east-region-1', repoName: 'acme/footer-test' }),
        ]}
      />
    );
    const footer = screen.getByText('production-east-region-1').closest('div.flex');
    expect(footer?.className).toMatch(/justify-between/);
  });

  it('multiple cards stack vertically via flex-col rather than wrapping into columns', () => {
    const { container } = render(
      <DeploymentTracker
        data={[makeDeployment({ repoName: 'acme/a' }), makeDeployment({ repoName: 'acme/b' })]}
      />
    );
    const list = container.querySelector('div.flex.flex-col');
    expect(list).not.toBeNull();
    expect(list?.className).not.toMatch(/flex-row/);
  });
});
