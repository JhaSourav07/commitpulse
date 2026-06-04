import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import { Notification } from './Notification';

describe('Notification Model', () => {
  it('is compiled properly and exposed', () => {
    expect(Notification).toBeDefined();
    expect(Notification.modelName).toBe('Notification');
  });

  it('enforces required, unique, and lowercase fields on username', () => {
    const usernamePath = Notification.schema.path('username') as mongoose.SchemaType & {
      options: Record<string, unknown>;
    };

    expect(usernamePath).toBeDefined();
    expect(usernamePath.options.required).toBe(true);
    expect(usernamePath.options.unique).toBe(true);
    expect(usernamePath.options.lowercase).toBe(true);
    expect(usernamePath.options.trim).toBe(true);
  });

  it('enforces required, lowercase, and trim fields on email', () => {
    const emailPath = Notification.schema.path('email') as mongoose.SchemaType & {
      options: Record<string, unknown>;
    };

    expect(emailPath).toBeDefined();
    expect(emailPath.options.required).toBe(true);
    expect(emailPath.options.lowercase).toBe(true);
    expect(emailPath.options.trim).toBe(true);
  });

  it('validates frequency field and its defaults and enums', () => {
    const frequencyPath = Notification.schema.path('frequency') as mongoose.SchemaType & {
      options: Record<string, unknown>;
      enumValues: string[];
    };

    expect(frequencyPath).toBeDefined();
    expect(frequencyPath.options.default).toBe('daily');
    expect(frequencyPath.enumValues).toContain('realtime');
    expect(frequencyPath.enumValues).toContain('daily');
    expect(frequencyPath.enumValues).toContain('weekly');
  });

  it('checks boolean notification switches have default value as true', () => {
    const notifyOnCommitPath = Notification.schema.path('notifyOnCommit') as mongoose.SchemaType & {
      options: Record<string, unknown>;
    };
    const notifyOnStreakPath = Notification.schema.path('notifyOnStreak') as mongoose.SchemaType & {
      options: Record<string, unknown>;
    };
    const notifyOnMilestonePath = Notification.schema.path(
      'notifyOnMilestone'
    ) as mongoose.SchemaType & {
      options: Record<string, unknown>;
    };

    expect(notifyOnCommitPath.options.default).toBe(true);
    expect(notifyOnStreakPath.options.default).toBe(true);
    expect(notifyOnMilestonePath.options.default).toBe(true);
  });

  it('checks isActive default value is true', () => {
    const isActivePath = Notification.schema.path('isActive') as mongoose.SchemaType & {
      options: Record<string, unknown>;
    };
    expect(isActivePath.options.default).toBe(true);
  });

  it('checks createdAt and updatedAt have default values', () => {
    const createdAtPath = Notification.schema.path('createdAt') as mongoose.SchemaType & {
      options: Record<string, unknown>;
    };
    const updatedAtPath = Notification.schema.path('updatedAt') as mongoose.SchemaType & {
      options: Record<string, unknown>;
    };

    expect(createdAtPath.options.default).toBeDefined();
    expect(updatedAtPath.options.default).toBeDefined();
  });
});
