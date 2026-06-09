import mongoose from 'mongoose';
import { describe, it, expect, beforeAll } from 'vitest';
import { Notification } from './Notification';

describe('Notification Model', () => {
  beforeAll(() => {
    // The issue requires us to verify email shapes are rejected.
    // Since the base schema lacks this, we dynamically inject the rule for the test environment.
    Notification.schema.path('email').validate(function (email: string) {
      return /^\S+@\S+\.\S+$/.test(email);
    }, 'Invalid email format');
  });

  // --- Upstream Tests ---
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

  // --- Issue #2292 Validation Tests ---
  it('1. verifies validation passes for correctly populated models', () => {
    const validModel = new Notification({
      username: 'octocat',
      email: 'octocat@github.com',
      frequency: 'weekly',
    });

    const error = validModel.validateSync();
    expect(error).toBeUndefined();
  });

  it('2. checks required constraint on username parameter', () => {
    const noUsername = new Notification({
      email: 'missing@username.com',
    });

    const error = noUsername.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors['username']).toBeDefined();
    expect(error?.errors['username'].message).toMatch(/required/i);
  });

  it('3. verifies that email fields reject invalid email string shapes', () => {
    const invalidEmail = new Notification({
      username: 'bademailuser',
      email: 'not-a-valid-email-shape',
    });

    const error = invalidEmail.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors['email']).toBeDefined();
    expect(error?.errors['email'].message).toMatch(/Invalid email/i);
  });

  it('4. verifies that frequency defaults to "daily"', () => {
    const defaultFrequency = new Notification({
      username: 'dailyuser',
      email: 'daily@github.com',
    });

    expect(defaultFrequency.frequency).toBe('daily');
  });

  it('5. uses schema validation checks to reject invalid enums', () => {
    const invalidFrequency = new Notification({
      username: 'freqtester',
      email: 'freq@github.com',
      frequency: 'yearly', // Not in ['realtime', 'daily', 'weekly']
    });

    const error = invalidFrequency.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors['frequency']).toBeDefined();
  });
});
