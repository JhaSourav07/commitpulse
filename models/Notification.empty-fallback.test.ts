import { describe, it, expect } from 'vitest';
import { Notification } from './Notification';

describe('Notification Model - Edge Cases & Empty/Missing Inputs Verification', () => {
  // 1. Missing required fields (Empty Object)
  it('throws validation errors when instantiated with completely empty parameters', () => {
    const notification = new Notification({});

    // validateSync() allows us to check schema rules without needing a real MongoDB connection
    const err = notification.validateSync();

    expect(err).toBeDefined();
    expect(err?.errors.username).toBeDefined();
    expect(err?.errors.username.message).toContain('Path `username` is required');

    expect(err?.errors.email).toBeDefined();
    expect(err?.errors.email.message).toContain('Path `email` is required');
  });

  // 2. Missing optional fields (Verify Default Fallbacks)
  it('applies default fallback configuration values when optional fields are completely missing', () => {
    const notification = new Notification({
      username: 'testuser',
      email: 'test@example.com',
    });

    const err = notification.validateSync();

    // Should have no validation errors since required fields are present
    expect(err).toBeUndefined();

    // Verify all the unconfigured object fields safely fell back to schema defaults
    expect(notification.frequency).toBe('daily');
    expect(notification.notifyOnCommit).toBe(true);
    expect(notification.notifyOnStreak).toBe(true);
    expect(notification.notifyOnMilestone).toBe(true);
    expect(notification.isActive).toBe(true);
    expect(notification.createdAt).toBeDefined();
    expect(notification.updatedAt).toBeDefined();
  });

  // 3. Empty string/whitespace handling
  it('fails validation safely if required strings contain only empty spaces', () => {
    const notification = new Notification({
      username: '   ', // Schema has `trim: true`, so this reduces to an empty string
      email: '   ',
    });

    const err = notification.validateSync();

    expect(err).toBeDefined();
    // Mongoose recognizes the trimmed empty string as a missing required field
    expect(err?.errors.username).toBeDefined();
    expect(err?.errors.email).toBeDefined();
  });

  // 4. Invalid Enum Inputs (Missing standard layout state)
  it('rejects invalid inputs for enumerated fields and prevents database corruption', () => {
    const notification = new Notification({
      username: 'testuser',
      email: 'test@example.com',
      frequency: 'hourly', // Invalid! Valid options are: realtime, daily, weekly
    });

    const err = notification.validateSync();

    expect(err).toBeDefined();
    expect(err?.errors.frequency).toBeDefined();
    expect(err?.errors.frequency.message).toContain('is not a valid enum value');
  });

  // 5. Type Casting Failures (Hydration/Runtime Error Resilience)
  it('gracefully handles invalid types by throwing standard cast errors instead of crashing', () => {
    const notification = new Notification({
      username: 'testuser',
      email: 'test@example.com',
      notifyOnCommit: 'not-a-boolean-value', // Injecting a raw string into a boolean field
    });

    const err = notification.validateSync();

    expect(err).toBeDefined();
    expect(err?.errors.notifyOnCommit).toBeDefined();
    expect(err?.errors.notifyOnCommit.name).toBe('CastError');
  });
});
