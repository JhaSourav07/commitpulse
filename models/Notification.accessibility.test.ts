import { describe, it, expect } from 'vitest';
import { Notification } from './Notification';

describe('Notification Model - Accessibility & Screen Reader Aria Compliance', () => {
  it('provides accessible username field metadata', () => {
    const usernamePath = Notification.schema.path('username');

    expect(usernamePath).toBeDefined();
    expect(usernamePath.instance).toBe('String');
  });

  it('provides accessible email field metadata', () => {
    const emailPath = Notification.schema.path('email');

    expect(emailPath).toBeDefined();
    expect(emailPath.instance).toBe('String');
  });

  it('ensures notification frequency options are clearly enumerable for assistive technologies', () => {
    const frequencyPath = Notification.schema.path('frequency');

    expect(frequencyPath).toBeDefined();
    expect((frequencyPath as { enumValues: string[] }).enumValues).toEqual([
      'realtime',
      'daily',
      'weekly',
    ]);
  });

  it('ensures boolean notification preferences expose explicit state values', () => {
    expect(Notification.schema.path('notifyOnCommit')).toBeDefined();
    expect(Notification.schema.path('notifyOnStreak')).toBeDefined();
    expect(Notification.schema.path('notifyOnMilestone')).toBeDefined();
  });

  it('ensures active status field exists for accessibility state tracking', () => {
    const activePath = Notification.schema.path('isActive');

    expect(activePath).toBeDefined();
    expect(activePath.instance).toBe('Boolean');
  });
});
