import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseWebhookEvent,
  cacheEvent,
  evaluateAlerts,
  setAlertConfig,
  generateCIReport,
} from './webhook-handler';

vi.mock('@/lib/cache', () => {
  const store = new Map<string, unknown>();
  class DistributedCache<T> {
    async get(key: string): Promise<T | null> {
      return (store.get(key) as T) ?? null;
    }
    async set(key: string, value: T): Promise<void> {
      store.set(key, value);
    }
    async delete(key: string): Promise<boolean> {
      return store.delete(key);
    }
  }
  return { DistributedCache };
});

// Use a recent timestamp so report-window assertions stay valid regardless of
// when the suite runs (the weekly window is 7 days).
const recentIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();

const sampleWorkflowPayload = {
  workflow_run: {
    id: 42,
    name: 'CI',
    status: 'completed',
    conclusion: 'success',
    created_at: recentIso,
    updated_at: recentIso,
    run_number: 7,
    repository: {
      name: 'commitpulse',
      full_name: 'JhaSourav07/commitpulse',
      owner: { login: 'JhaSourav07', type: 'User' },
    },
    head_branch: 'main',
    head_commit: {
      id: 'abc1234567890',
      message: 'fix: update tests',
      timestamp: '2026-06-16T09:58:00Z',
      author: { name: 'Anshul Jain', email: 'anshul23102@iiitd.ac.in' },
    },
  },
};

describe('parseWebhookEvent', () => {
  it('parses a workflow_run success event', () => {
    const event = parseWebhookEvent(sampleWorkflowPayload);
    expect(event).not.toBeNull();
    expect(event?.type).toBe('workflow_run');
    expect(event?.status).toBe('success');
    expect(event?.repository).toBe('JhaSourav07/commitpulse');
  });

  it('parses a workflow_run failure event', () => {
    const payload = {
      workflow_run: {
        ...sampleWorkflowPayload.workflow_run,
        conclusion: 'failure',
      },
    };
    const event = parseWebhookEvent(payload);
    expect(event?.status).toBe('failure');
  });

  it('parses in_progress status as pending', () => {
    const payload = {
      workflow_run: {
        ...sampleWorkflowPayload.workflow_run,
        status: 'in_progress',
        conclusion: null,
      },
    };
    const event = parseWebhookEvent(payload);
    expect(event?.status).toBe('pending');
  });

  it('returns null when no workflow_run or check_run in payload', () => {
    const event = parseWebhookEvent({});
    expect(event).toBeNull();
  });
});

describe('cacheEvent', () => {
  it('stores event without throwing', async () => {
    const event = parseWebhookEvent(sampleWorkflowPayload)!;
    await expect(cacheEvent(event)).resolves.toBeUndefined();
  });
});

describe('setAlertConfig and evaluateAlerts', () => {
  beforeEach(async () => {
    await setAlertConfig('JhaSourav07/commitpulse', {
      enabled: true,
      onFailure: true,
      onSuccess: false,
    });
  });

  it('does not trigger alert for success when onSuccess is false', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const event = parseWebhookEvent(sampleWorkflowPayload)!;
    await evaluateAlerts(event);
    consoleSpy.mockRestore();
  });

  it('triggers email alert for failure when onFailure is true', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const failPayload = {
      workflow_run: {
        ...sampleWorkflowPayload.workflow_run,
        conclusion: 'failure',
      },
    };
    const event = parseWebhookEvent(failPayload)!;
    await setAlertConfig('JhaSourav07/commitpulse', {
      enabled: true,
      onFailure: true,
      onSuccess: false,
      email: 'test@example.com',
    });
    await evaluateAlerts(event);
    consoleSpy.mockRestore();
  });
});

describe('generateCIReport', () => {
  it('returns a report with correct structure for daily period', () => {
    const events = [parseWebhookEvent(sampleWorkflowPayload)!];
    const report = generateCIReport(events, 'daily');
    expect(report.period).toBe('daily');
    expect(typeof report.totalEvents).toBe('number');
    expect(report.repositories).toBeDefined();
  });

  it('counts success and failure correctly', () => {
    const successEvent = parseWebhookEvent(sampleWorkflowPayload)!;
    const failureEvent = parseWebhookEvent({
      workflow_run: {
        ...sampleWorkflowPayload.workflow_run,
        conclusion: 'failure',
      },
    })!;

    const report = generateCIReport([successEvent, failureEvent], 'weekly') as {
      repositories: Record<
        string,
        { total: number; success: number; failure: number; successRate: string }
      >;
    };

    const repo = report.repositories['JhaSourav07/commitpulse'];
    expect(repo).toBeDefined();
    expect(repo.total).toBe(2);
    expect(repo.success).toBe(1);
    expect(repo.failure).toBe(1);
    expect(repo.successRate).toBe('50.0%');
  });

  it('returns zero counts for events outside the period window', () => {
    const oldEvent: Parameters<typeof generateCIReport>[0][0] = {
      type: 'workflow_run',
      repository: 'JhaSourav07/commitpulse',
      timestamp: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'success',
      details: { id: 1 },
    };
    const report = generateCIReport([oldEvent], 'daily') as { totalEvents: number };
    expect(report.totalEvents).toBe(0);
  });
});
