// DeploymentTracker.error-resilience.test.tsx
//
// The component receives data over the network in practice, so this suite
// throws malformed/hostile shapes at it (missing fields, wrong types, extreme
// strings) and asserts it degrades gracefully instead of throwing.

import { describe, it, expect, vi } from 'vitest';
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

describe('DeploymentTracker — error resilience', () => {
  it('does not throw when a required string field is missing from the object', () => {
    const malformed = { ...makeDeployment() } as Partial<DeploymentData>;
    delete malformed.repoName;
    expect(() => render(<DeploymentTracker data={[malformed as DeploymentData]} />)).not.toThrow();
  });

  it('does not throw when repoUrl is an empty string', () => {
    expect(() =>
      render(<DeploymentTracker data={[makeDeployment({ repoUrl: '' })]} />)
    ).not.toThrow();
  });

  it('does not throw when repoUrl is not actually a valid URL', () => {
    expect(() =>
      render(<DeploymentTracker data={[makeDeployment({ repoUrl: 'totally not a url' })]} />)
    ).not.toThrow();
    // href is rendered as-is; the browser/anchor doesn't validate it client-side.
    expect(screen.getByRole('link', { name: /acme\/web-app/i })).toHaveAttribute(
      'href',
      'totally not a url'
    );
  });

  it('does not throw when liveUrl lacks a protocol (replace regex has nothing to strip)', () => {
    render(<DeploymentTracker data={[makeDeployment({ liveUrl: 'web-app.acme.dev' })]} />);
    expect(screen.getByText('web-app.acme.dev')).toBeInTheDocument();
  });

  it('does not throw on a deeply malformed deployedAt (object instead of string)', () => {
    const malformed = makeDeployment({
      deployedAt: { not: 'a string' } as unknown as string,
    });
    expect(() => render(<DeploymentTracker data={[malformed]} />)).not.toThrow();
    expect(screen.getByText('Deployed Unknown')).toBeInTheDocument();
  });

  it('does not throw when status is missing entirely (undefined)', () => {
    const malformed = { ...makeDeployment() } as Partial<DeploymentData>;
    delete malformed.status;
    expect(() => render(<DeploymentTracker data={[malformed as DeploymentData]} />)).not.toThrow();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('throws when the data array contains a null entry (KNOWN FRAGILITY — no null guard in .map())', () => {
    // Documents real, current behavior: DeploymentTracker.tsx accesses
    // d.repoUrl/d.status/etc. directly inside data.map() with no null check,
    // so a null/undefined entry crashes the render instead of degrading
    // gracefully. If the component is hardened later, flip this to
    // `.not.toThrow()`.
    const list = [makeDeployment(), null as unknown as DeploymentData];
    expect(() => render(<DeploymentTracker data={list} />)).toThrow(
      /Cannot read properties of null/
    );
  });

  it('does not throw on an extremely long repoName (no overflow crash, just CSS truncation)', () => {
    const longName = 'acme/' + 'x'.repeat(500);
    expect(() =>
      render(<DeploymentTracker data={[makeDeployment({ repoName: longName })]} />)
    ).not.toThrow();
    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  it('does not throw on repoName containing HTML-like characters (React escapes, no injection)', () => {
    const dangerous = '<img src=x onerror=alert(1)>';
    render(<DeploymentTracker data={[makeDeployment({ repoName: dangerous })]} />);
    // Rendered as literal text content, not parsed as an element.
    expect(screen.getByText(dangerous)).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).not.toBeInTheDocument();
  });

  it('does not throw when deployedAt is in the future (negative-seconds guarded by Math.max(0, …))', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    render(<DeploymentTracker data={[makeDeployment({ deployedAt: future })]} />);
    // Falls through every unit and lands on "Just now" rather than negative values.
    expect(screen.getByText('Deployed Just now')).toBeInTheDocument();
  });

  it('does not throw and logs no console errors for a fully valid render', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<DeploymentTracker data={[makeDeployment()]} />);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('does not throw when the same repoName is duplicated across entries (key collision)', () => {
    const dup = [
      makeDeployment({ repoName: 'acme/dup' }),
      makeDeployment({ repoName: 'acme/dup' }),
    ];
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<DeploymentTracker data={dup} />)).not.toThrow();
    errorSpy.mockRestore();
  });
});
