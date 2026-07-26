// DeploymentTracker.type-compiler.test.tsx
//
// These are compile-time checks, not runtime assertions: the value is in
// whether `tsc`/vitest's type-checking catches a violation. Each "it" still
// performs a trivial runtime assertion (so the test isn't reported as
// empty), but the real assertion is the TypeScript code itself — invalid
// shapes are wrapped in `// @ts-expect-error` and the suite fails to
// type-check if that line stops being an actual error (e.g. the prop became
// optional, or the union widened).
//
// Run with `vitest --typecheck` (or `tsc --noEmit`) for this file to do
// anything meaningful; under plain vitest these still pass as plain runtime
// tests but lose their type-checking value.

import { describe, it, expect } from 'vitest';
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

describe('DeploymentTracker — type compiler contracts', () => {
  it('accepts a fully valid DeploymentData[] for the data prop', () => {
    const valid: DeploymentData[] = [makeDeployment()];
    const element = <DeploymentTracker data={valid} />;
    expect(element.props.data).toBe(valid);
  });

  it('accepts being rendered with no props at all (data is optional)', () => {
    const element = <DeploymentTracker />;
    expect(element.props.data).toBeUndefined();
  });

  it('accepts an explicit empty array', () => {
    const element = <DeploymentTracker data={[]} />;
    expect(element.props.data).toEqual([]);
  });

  it('WorkflowStatus only accepts the four known literal values at compile time', () => {
    const valid: WorkflowStatus[] = ['success', 'failure', 'in_progress', 'unknown'];
    expect(valid).toHaveLength(4);

    // @ts-expect-error - "queued" is not part of the WorkflowStatus union
    const invalidStatus: WorkflowStatus = 'queued';
    expect(invalidStatus).toBe('queued'); // runtime no-op; the type error above is the real test
  });

  it('rejects a DeploymentData missing the required repoName field', () => {
    // @ts-expect-error - repoName is required and missing here
    const invalid: DeploymentData = {
      repoUrl: 'https://github.com/acme/x',
      liveUrl: null,
      status: 'success',
      deployedAt: null,
      environment: 'production',
      workflowName: null,
    };
    expect(invalid.repoUrl).toBe('https://github.com/acme/x');
  });

  it('rejects passing data as a non-array (single object) to the component', () => {
    const single = makeDeployment();
    // @ts-expect-error - data must be DeploymentData[], not a bare DeploymentData
    const element = <DeploymentTracker data={single} />;
    expect(element.props.data).toBe(single);
  });

  it('rejects liveUrl being undefined instead of explicit null (type is string | null, not optional)', () => {
    const base = makeDeployment();
    // @ts-expect-error - liveUrl must be string | null; undefined is not assignable
    const invalid: DeploymentData = { ...base, liveUrl: undefined };
    expect(invalid).toBeDefined();
  });

  it('rejects deployedAt being a number (must be string | null, an ISO timestamp)', () => {
    const base = makeDeployment();
    // @ts-expect-error - deployedAt must be string | null, not a Unix timestamp number
    const invalid: DeploymentData = { ...base, deployedAt: Date.now() };
    expect(invalid).toBeDefined();
  });

  it('rejects status being a boolean or other non-WorkflowStatus type', () => {
    const base = makeDeployment();
    // @ts-expect-error - status must be one of the WorkflowStatus literals
    const invalid: DeploymentData = { ...base, status: true };
    expect(invalid).toBeDefined();
  });

  it('rejects an extra unknown property not defined on DeploymentData (excess property check)', () => {
    const invalid: DeploymentData = {
      repoName: 'acme/web-app',
      repoUrl: 'https://github.com/acme/web-app',
      liveUrl: 'https://web-app.acme.dev',
      status: 'success',
      deployedAt: new Date().toISOString(),
      environment: 'production',
      workflowName: 'Vercel Production Deployment',
      // @ts-expect-error - "region" is not a key of DeploymentData and must trigger a compile error directly here
      region: 'us-east-1',
    };
    expect(invalid).toBeDefined();
  });

  it('accepts workflowName as null (the documented nullable case) without error', () => {
    const valid: DeploymentData = { ...makeDeployment(), workflowName: null };
    expect(valid.workflowName).toBeNull();
  });

  it('DeploymentTrackerProps shape matches what the component destructures (data is the only prop)', () => {
    // Establishes that passing any second unrelated prop is a type error,
    // protecting against silently-ignored typos in calling code.
    // @ts-expect-error - "deployments" is not a valid prop name; the component expects "data"
    const element = <DeploymentTracker deployments={[makeDeployment()]} />;
    expect(element).toBeDefined();
  });
});
