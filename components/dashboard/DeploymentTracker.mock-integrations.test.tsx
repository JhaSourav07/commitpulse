// DeploymentTracker.mock-integrations.test.tsx
//
// DeploymentTracker is a pure presentational component (data comes in via
// props), so "integration" here means: simulate the shapes a real upstream
// integration (GitHub Actions API, Vercel API, a Next.js server component
// fetch) would hand it, including a parent component pattern using
// fetch -> state -> prop.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useEffect, useState } from 'react';
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

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Minimal parent that mirrors how this component is likely consumed in the app. */
function DeploymentTrackerContainer({ url }: { url: string }) {
  const [data, setData] = useState<DeploymentData[]>([]);
  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData([]));
  }, [url]);
  return <DeploymentTracker data={data} />;
}

describe('DeploymentTracker — mock integrations', () => {
  it('renders correctly when fed a GitHub-Actions-shaped payload via a fetch-based parent', async () => {
    const payload: DeploymentData[] = [
      makeDeployment({
        repoName: 'acme/web-app',
        workflowName: 'Vercel Production Deployment',
        status: 'success',
      }),
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve(payload) }));

    render(<DeploymentTrackerContainer url="/api/deployments" />);

    await waitFor(() => {
      expect(screen.getByText('acme/web-app')).toBeInTheDocument();
    });
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('shows nothing while the mocked fetch is pending, then renders once resolved', async () => {
    let resolvePromise: (value: DeploymentData[]) => void;
    const pending = new Promise<DeploymentData[]>((resolve) => {
      resolvePromise = resolve;
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => pending }));

    const { container } = render(<DeploymentTrackerContainer url="/api/deployments" />);
    expect(container).toBeEmptyDOMElement();

    resolvePromise!([makeDeployment({ repoName: 'acme/late-arrival' })]);
    await waitFor(() => {
      expect(screen.getByText('acme/late-arrival')).toBeInTheDocument();
    });
  });

  it('degrades to empty render when the mocked fetch rejects (network failure)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const { container } = render(<DeploymentTrackerContainer url="/api/deployments" />);

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('handles a mocked API returning an in_progress workflow with a live pulse indicator', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve([
            makeDeployment({ repoName: 'acme/deploying-now', status: 'in_progress' }),
          ]),
      })
    );

    render(<DeploymentTrackerContainer url="/api/deployments" />);

    await waitFor(() => {
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  it('handles a mocked Vercel-style payload where liveUrl reflects a preview alias', async () => {
    const payload = [
      makeDeployment({
        repoName: 'acme/marketing-site',
        liveUrl: 'https://marketing-site-git-main-acme.vercel.app',
        environment: 'production',
      }),
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve(payload) }));

    render(<DeploymentTrackerContainer url="/api/deployments" />);

    await waitFor(() => {
      expect(screen.getByText('marketing-site-git-main-acme.vercel.app')).toBeInTheDocument();
    });
  });

  it('passes through a directly-provided pre-fetched array (server-component-style usage) without a network call', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<DeploymentTracker data={[makeDeployment({ repoName: 'acme/server-rendered' })]} />);

    expect(screen.getByText('acme/server-rendered')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
