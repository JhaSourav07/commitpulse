// @vitest-environment jsdom
import { fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { POST, GET } from './route';
import { Notification } from '@/models/Notification';
import { gitHubUserValidator } from '@/services/github/validate-user';

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/cache', () => {
  return {
    DistributedCache: class {
      constructor() {}
      get = vi.fn().mockResolvedValue(null);
      set = vi.fn().mockResolvedValue(undefined);
    },
  };
});

vi.mock('@/models/Notification', () => ({
  Notification: {
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock('@/services/github/validate-user', () => ({
  gitHubUserValidator: {
    validateUser: vi.fn(),
  },
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: () => '127.0.0.1',
}));

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn().mockResolvedValue({
    verified: true,
    status: 200,
    message: '',
  }),
}));

vi.mock('@/lib/notification-management-token', () => ({
  createNotificationManagementToken: vi.fn(() => 'mock-management-token'),
  getNotificationManagementToken: vi.fn(() => null),
  hashNotificationManagementToken: vi.fn(() => 'mock-management-token-hash'),
  verifyNotificationManagementToken: vi.fn(() => false),
}));

vi.mock('@/lib/rate-limit', () => ({
  notifyRateLimiter: {
    checkWithResult: vi.fn(() =>
      Promise.resolve({
        success: true,
        remaining: 10,
        limit: 100,
        reset: Date.now(),
      })
    ),
    check: vi.fn(() => Promise.resolve(true)),
  },
  getRateLimitHeaders: () => ({
    'X-RateLimit-Limit': '100',
  }),
}));

vi.mock('@/lib/validations', () => ({
  notifyPostSchema: {
    safeParse: (body: unknown) => ({
      success: true,
      data: body as {
        username: string;
        email: string;
        frequency: string;
        preferences: {
          notifyOnCommit: boolean;
          notifyOnStreak: boolean;
          notifyOnMilestone: boolean;
        };
      },
    }),
  },
  notifyGetSchema: {
    safeParse: (query: { user?: string }) => ({
      success: true,
      data: { user: query.user as string },
    }),
  },
}));

/**
 * Builds a synthetic interactive UI node — a "Manage Notifications" trigger
 * with a tooltip overlay — and wires its click/touch handlers to the real
 * POST/GET handlers from app/api/notify/route.ts.
 */
function createInteractiveNotifyTrigger() {
  const parent = document.createElement('div');
  const trigger = document.createElement('button');
  const tooltip = document.createElement('div');

  let latestResponse: Response | null = null;

  parent.dataset.testid = 'notify-interaction-root';

  trigger.type = 'button';
  trigger.className = 'cursor-pointer hover:cursor-pointer transition-opacity';
  trigger.textContent = 'Manage Notifications';

  tooltip.hidden = true;
  tooltip.className = 'pointer-events-none fixed opacity-0 transition-opacity';
  tooltip.textContent = 'Click to subscribe to streak notifications';

  vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
    left: 30,
    top: 50,
    width: 180,
    height: 40,
    right: 210,
    bottom: 90,
    x: 30,
    y: 50,
    toJSON: () => ({}),
  } as DOMRect);

  trigger.addEventListener('mouseenter', () => {
    tooltip.hidden = false;
    tooltip.classList.remove('opacity-0');
    tooltip.classList.add('opacity-100');
  });

  trigger.addEventListener('mousemove', (event) => {
    const rect = trigger.getBoundingClientRect();

    const x = event instanceof MouseEvent ? event.clientX - rect.left : 0;
    const y = event instanceof MouseEvent ? event.clientY - rect.top : 0;

    tooltip.style.left = `${Math.round(rect.left + x)}px`;
    tooltip.style.top = `${Math.round(rect.top + y + 12)}px`;
  });

  trigger.addEventListener('mouseleave', () => {
    tooltip.hidden = true;
    tooltip.classList.remove('opacity-100');
    tooltip.classList.add('opacity-0');
  });

  trigger.addEventListener('click', async () => {
    const req = new Request('http://localhost/api/notify', {
      method: 'POST',
      body: JSON.stringify({
        username: 'octocat',
        email: 'octocat@example.com',
        frequency: 'daily',
        preferences: {
          notifyOnCommit: true,
          notifyOnStreak: true,
          notifyOnMilestone: true,
        },
      }),
    });

    latestResponse = await POST(req);
  });

  trigger.addEventListener('touchstart', async () => {
    const req = new Request('http://localhost/api/notify?user=octocat', {
      method: 'GET',
    });

    latestResponse = await GET(req);
  });

  parent.append(trigger, tooltip);
  document.body.append(parent);

  return {
    parent,
    tooltip,
    trigger,
    getLatestResponse: () => latestResponse,
  };
}

describe('Notify route — Interactive Tooltips, Hovers & Touch Propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';

    vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017/test');
    vi.stubEnv('NODE_ENV', 'development');

    vi.mocked(gitHubUserValidator.validateUser).mockResolvedValue(true);

    vi.mocked(Notification.findOneAndUpdate).mockResolvedValue({
      username: 'octocat',
      email: 'octocat@example.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);

    vi.mocked(Notification.findOne).mockResolvedValue({
      username: 'octocat',
      email: 'octocat@example.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    } as never);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('triggers a hover gesture and reveals the notification tooltip', () => {
    const { tooltip, trigger } = createInteractiveNotifyTrigger();

    fireEvent.mouseEnter(trigger);

    expect(tooltip.hidden).toBe(false);
    expect(tooltip).toHaveClass('opacity-100');
  });

  it('displays the responsive tooltip at computed cursor coordinates', () => {
    const { tooltip, trigger } = createInteractiveNotifyTrigger();

    fireEvent.mouseEnter(trigger);
    fireEvent.mouseMove(trigger, {
      clientX: 150,
      clientY: 70,
    });

    expect(tooltip.style.left).toBe('150px');
    expect(tooltip.style.top).toBe('82px');
  });

  it('propagates click gestures and persists the subscription via POST', async () => {
    const { getLatestResponse, trigger } = createInteractiveNotifyTrigger();

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(getLatestResponse()).not.toBeNull();
    });

    expect(getLatestResponse()?.status).toBe(200);
    expect(Notification.findOneAndUpdate).toHaveBeenCalledOnce();

    const [filter] = vi.mocked(Notification.findOneAndUpdate).mock.calls[0];
    expect(filter).toEqual({ username: 'octocat' });
  });

  it('propagates touch gestures and fetches subscription status via GET', async () => {
    const { getLatestResponse, trigger } = createInteractiveNotifyTrigger();

    fireEvent.touchStart(trigger);

    await waitFor(() => {
      expect(getLatestResponse()).not.toBeNull();
    });

    expect(getLatestResponse()?.status).toBe(200);

    const json = await getLatestResponse()!.json();
    expect(json.data.username).toBe('octocat');
    expect(Notification.findOne).toHaveBeenCalledWith({ username: 'octocat' });
  });

  it('keeps pointer cursor classes and hides the tooltip on mouseleave', () => {
    const { tooltip, trigger } = createInteractiveNotifyTrigger();

    expect(trigger).toHaveClass('cursor-pointer');
    expect(trigger.className).toContain('hover:cursor-pointer');

    fireEvent.mouseEnter(trigger);
    expect(tooltip).toHaveClass('opacity-100');

    fireEvent.mouseLeave(trigger);

    expect(tooltip.hidden).toBe(true);
    expect(tooltip).toHaveClass('opacity-0');
  });
});
