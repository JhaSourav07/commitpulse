import { describe, expect, it } from 'vitest';
import { Notification } from './Notification';

describe('Notification massive scaling behavior', () => {
  it('creates 1000 notification documents without throwing', () => {
    expect(() => {
      Array.from({ length: 1000 }, (_, i) => {
        return new Notification({
          username: `user${i}`,
          email: `user${i}@example.com`,
        });
      });
    }).not.toThrow();
  });

  it('keeps default notification flags stable across many documents', () => {
    const notifications = Array.from({ length: 500 }, (_, i) => {
      return new Notification({
        username: `user${i}`,
        email: `user${i}@example.com`,
      });
    });

    expect(notifications.every((n) => n.notifyOnCommit === true)).toBe(true);
    expect(notifications.every((n) => n.notifyOnStreak === true)).toBe(true);
    expect(notifications.every((n) => n.notifyOnMilestone === true)).toBe(true);
    expect(notifications.every((n) => n.isActive === true)).toBe(true);
  });

  it('normalizes usernames and emails consistently under high volume', () => {
    const notifications = Array.from({ length: 300 }, (_, i) => {
      return new Notification({
        username: `  USER${i}  `,
        email: `  USER${i}@EXAMPLE.COM  `,
      });
    });

    expect(notifications[0].username).toBe('user0');
    expect(notifications[0].email).toBe('user0@example.com');
    expect(notifications[299].username).toBe('user299');
    expect(notifications[299].email).toBe('user299@example.com');
  });

  it('supports all allowed frequency values across many documents', () => {
    const frequencies = ['realtime', 'daily', 'weekly'] as const;

    const notifications = Array.from({ length: 300 }, (_, i) => {
      return new Notification({
        username: `user${i}`,
        email: `user${i}@example.com`,
        frequency: frequencies[i % frequencies.length],
      });
    });

    expect(notifications.filter((n) => n.frequency === 'realtime')).toHaveLength(100);
    expect(notifications.filter((n) => n.frequency === 'daily')).toHaveLength(100);
    expect(notifications.filter((n) => n.frequency === 'weekly')).toHaveLength(100);
  });

  it('preserves date defaults across bulk-created documents', () => {
    const notifications = Array.from({ length: 200 }, (_, i) => {
      return new Notification({
        username: `user${i}`,
        email: `user${i}@example.com`,
      });
    });

    expect(notifications.every((n) => n.createdAt instanceof Date)).toBe(true);
    expect(notifications.every((n) => n.updatedAt instanceof Date)).toBe(true);
  });
});
