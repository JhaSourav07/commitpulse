import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import React from 'react';
import ResumePreviewForm from './ResumePreviewForm';
import { DistributedCache } from '@/lib/cache';

// Mock framer-motion motion.div used in component
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{props.children}</div>
    ),
  },
}));

// Hoisted toast spies
const toasts = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: toasts.error, success: toasts.success } }));

const parsed = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  skills: ['React'],
  education: [],
  experience: [],
};

describe('ResumePreviewForm - Mock Integrations & Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // remove any existing fetch binding on globalThis in a type-safe way
    const g = globalThis as unknown as { fetch?: unknown };
    delete g.fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('DistributedCache.get falls back to local cache when Redis fetch fails', async () => {
    // Enable Redis mode
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

    // Mock fetch to simulate network error
    const fetchMock = vi.fn().mockRejectedValue(new Error('network error'));
    (globalThis as unknown as { fetch?: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    const cache = new DistributedCache<number>();

    // Write to local cache directly
    await cache.set('counter', 42, 1000);

    const value = await cache.get('counter');
    expect(value).toBe(42);
    // Even though Redis is configured, fetch was attempted and failed
    expect(fetchMock).toHaveBeenCalled();
  });

  it('component shows pending overlay when save request is pending', async () => {
    // Build a fetch promise that never resolves
    const pending = new Promise<unknown>(() => {
      // intentionally never resolve
    });
    const pendingFetch = vi.fn(() => pending) as unknown as typeof fetch;
    (globalThis as unknown as { fetch?: typeof fetch }).fetch = pendingFetch;

    const onBack = vi.fn();
    const onComplete = vi.fn();

    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={parsed}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const saveButton = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(saveButton);

    // Button should become disabled and show 'Saving...'
    expect(saveButton).toBeDisabled();
    expect(saveButton.textContent).toContain('Saving...');
  });

  it('local cache is checked before triggering Redis HTTP GET', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

    // Mock fetch to throw if called (should not be called because local cache populated)
    const fetchMock = vi.fn().mockRejectedValue(new Error('should not call'));
    (globalThis as unknown as { fetch?: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    const cache = new DistributedCache<string>();

    (
      cache as unknown as {
        localCache: { set: (key: string, value: unknown, ttl: number) => void };
      }
    ).localCache.set('user:1', 'alice', 1000);

    const value = await cache.get('user:1');
    expect(value).toBe('alice');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('handles fetch timeout/failure and shows toast.error', async () => {
    // Mock fetch to reject (simulate timeout/failure)
    const timeoutFetch = vi.fn().mockRejectedValue(new Error('timeout'));
    (globalThis as unknown as { fetch?: typeof fetch }).fetch =
      timeoutFetch as unknown as typeof fetch;

    const onBack = vi.fn();
    const onComplete = vi.fn();

    render(
      <ResumePreviewForm
        githubUsername="john"
        parsed={{ ...parsed, name: 'X', email: 'y' }}
        fileName="resume.pdf"
        onBack={onBack}
        onComplete={onComplete}
      />
    );

    const saveButton = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalled();
    });

    // After failure, button should be enabled again
    expect(saveButton).not.toBeDisabled();
  });

  it('DistributedCache.set writes to local cache and calls Redis SET when enabled', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

    // Mock fetch to simulate successful SET
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: 'OK' }) });
    (globalThis as unknown as { fetch?: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    const cache = new DistributedCache<{ name: string }>();
    await cache.set('profile:1', { name: 'bob' }, 5000);

    // Local cache should have the value
    const local = await cache.get('profile:1');
    expect(local).toEqual({ name: 'bob' });

    // fetch should be called at least once for SET
    expect(fetchMock).toHaveBeenCalled();

    // Check that the SET body includes 'SET' command
    const firstCall = (fetchMock.mock.calls[0] as unknown[]) || [];
    const options = firstCall[1] as unknown as { body?: string } | undefined;
    const lastCallBody = options && options.body ? JSON.parse(options.body) : null;
    expect(lastCallBody && lastCallBody[0]).toBe('SET');
  });
});
