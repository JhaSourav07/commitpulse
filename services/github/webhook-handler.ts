import { DistributedCache } from '@/lib/cache';
import { redactSecrets } from '@/lib/secretScanner';
import type { CIWorkflowRun, CIInsights } from '@/types/ci-analytics';

interface WebhookPayload {
  action?: string;
  repository?: {
    name: string;
    full_name: string;
    owner: {
      login: string;
      type: string;
    };
  };
  workflow_run?: {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    created_at: string;
    updated_at: string;
    run_number: number;
    repository: {
      name: string;
      full_name: string;
      owner: {
        login: string;
        type: string;
      };
    };
    head_branch: string;
    head_commit: {
      id: string;
      message: string;
      timestamp: string;
      author: {
        name: string;
        email: string;
      };
    };
  };
  pull_request?: {
    number: number;
    title: string;
    head: {
      ref: string;
    };
    base: {
      ref: string;
    };
  };
  check_run?: {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    started_at: string;
    completed_at: string | null;
  };
}

interface CIEvent {
  type: 'workflow_run' | 'check_run' | 'push' | 'pull_request';
  repository: string;
  timestamp: string;
  status: 'success' | 'failure' | 'pending' | 'skipped';
  details: Record<string, unknown>;
}

interface AlertConfig {
  enabled: boolean;
  onFailure: boolean;
  onSuccess: boolean;
  webhookUrl?: string;
  email?: string;
}

const eventCache = new DistributedCache<CIEvent>(1000);
const alertCache = new DistributedCache<AlertConfig>(100);

function normalizeWorkflowStatus(status: string, conclusion: string | null): CIEvent['status'] {
  if (status === 'in_progress' || status === 'queued') return 'pending';
  if (conclusion === 'success') return 'success';
  if (conclusion === 'failure') return 'failure';
  if (conclusion === 'cancelled' || conclusion === 'skipped') return 'skipped';
  return 'pending';
}

function extractWorkflowEvent(payload: WebhookPayload): CIEvent | null {
  if (!payload.workflow_run) return null;

  const run = payload.workflow_run;
  return {
    type: 'workflow_run',
    repository: run.repository.full_name,
    timestamp: run.updated_at,
    status: normalizeWorkflowStatus(run.status, run.conclusion),
    details: {
      id: run.id,
      name: run.name,
      runNumber: run.run_number,
      branch: run.head_branch,
      commit: run.head_commit.id.substring(0, 7),
      // Commit messages can carry accidentally pasted credentials; scrub
      // them before they reach analytics storage and dashboards.
      message: redactSecrets(run.head_commit.message),
      author: run.head_commit.author.name,
    },
  };
}

function extractCheckRunEvent(payload: WebhookPayload): CIEvent | null {
  if (!payload.check_run) return null;

  const checkRun = payload.check_run;
  const repo = payload.repository || payload.workflow_run?.repository;

  if (!repo) return null;

  return {
    type: 'check_run',
    repository: repo.full_name,
    timestamp: checkRun.completed_at || checkRun.started_at,
    status: normalizeWorkflowStatus(checkRun.status, checkRun.conclusion),
    details: {
      id: checkRun.id,
      name: checkRun.name,
      status: checkRun.status,
      conclusion: checkRun.conclusion,
    },
  };
}

export function parseWebhookEvent(payload: WebhookPayload): CIEvent | null {
  const event = extractWorkflowEvent(payload) || extractCheckRunEvent(payload);
  return event;
}

export async function cacheEvent(event: CIEvent): Promise<void> {
  const cacheKey = `${event.repository}:${event.timestamp}:${event.details.id || ''}`;
  await eventCache.set(cacheKey, event, 3600 * 1000);
}

export async function evaluateAlerts(event: CIEvent): Promise<void> {
  const alertKey = `alert:${event.repository}`;
  const config = await alertCache.get(alertKey);

  if (!config || !config.enabled) return;

  const shouldAlert =
    (event.status === 'failure' && config.onFailure) ||
    (event.status === 'success' && config.onSuccess);

  if (!shouldAlert) return;

  if (config.webhookUrl) {
    await sendWebhookAlert(config.webhookUrl, event);
  }

  if (config.email) {
    await sendEmailAlert(config.email, event);
  }
}

async function sendWebhookAlert(webhookUrl: string, event: CIEvent): Promise<void> {
  try {
    const payload = {
      repository: event.repository,
      status: event.status,
      type: event.type,
      timestamp: event.timestamp,
      details: event.details,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Webhook alert failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to send webhook alert:', error);
  }
}

async function sendEmailAlert(email: string, event: CIEvent): Promise<void> {
  try {
    const subject =
      event.status === 'failure'
        ? `CI/CD Pipeline Failed: ${event.repository}`
        : `CI/CD Pipeline Succeeded: ${event.repository}`;

    const body = `
Pipeline Status: ${event.status.toUpperCase()}
Repository: ${event.repository}
Time: ${new Date(event.timestamp).toISOString()}

Details:
${Object.entries(event.details)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}
    `;

    console.log(`Email alert would be sent to ${email}:`, { subject, body });
  } catch (error) {
    console.error('Failed to send email alert:', error);
  }
}

export function generateCIReport(
  events: CIEvent[],
  period: 'daily' | 'weekly' | 'monthly'
): Record<string, unknown> {
  const now = new Date();
  const periodMs =
    period === 'daily'
      ? 24 * 60 * 60 * 1000
      : period === 'weekly'
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

  const filteredEvents = events.filter(
    (event) => new Date(event.timestamp).getTime() > now.getTime() - periodMs
  );

  const repositoryCounts = new Map<string, { success: number; failure: number; pending: number }>();

  for (const event of filteredEvents) {
    const counts = repositoryCounts.get(event.repository) || {
      success: 0,
      failure: 0,
      pending: 0,
    };

    if (event.status === 'success') counts.success++;
    else if (event.status === 'failure') counts.failure++;
    else if (event.status === 'pending') counts.pending++;

    repositoryCounts.set(event.repository, counts);
  }

  const repositories: Record<
    string,
    { total: number; success: number; failure: number; pending: number; successRate: string }
  > = {};

  for (const [repo, counts] of repositoryCounts.entries()) {
    const total = counts.success + counts.failure + counts.pending;
    const successRate = total > 0 ? ((counts.success / total) * 100).toFixed(1) : '0';

    repositories[repo] = {
      total,
      success: counts.success,
      failure: counts.failure,
      pending: counts.pending,
      successRate: `${successRate}%`,
    };
  }

  return {
    period,
    generatedAt: now.toISOString(),
    totalEvents: filteredEvents.length,
    repositories,
  };
}

export async function setAlertConfig(
  repository: string,
  config: Partial<AlertConfig>
): Promise<void> {
  const alertKey = `alert:${repository}`;
  const existing = (await alertCache.get(alertKey)) ?? ({ enabled: true } as AlertConfig);
  const merged: AlertConfig = { ...existing, ...config } as AlertConfig;
  await alertCache.set(alertKey, merged, 86400 * 1000);
}
