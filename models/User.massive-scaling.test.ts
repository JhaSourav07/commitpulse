import { describe, it, expect } from 'vitest';
import { User } from './User';

describe('UserModel Schema Validation Tests', () => {
  it('1. successfully creates a valid user with default values applied', () => {
    const user = new User({ username: 'testuser' });

    // Check required fields
    expect(user.username).toBe('testuser');

    // Check default values applied by Mongoose
    expect(user.visitCount).toBe(0);
    expect(user.createdAt).toBeInstanceOf(Date);

    // Should pass schema validation with no errors
    expect(user.validateSync()).toBeUndefined();
  });

  it('2. throws a validation error when the required username field is missing', () => {
    const user = new User({});
    const error = user.validateSync();

    expect(error).toBeDefined();
    expect(error?.errors.username).toBeDefined();
    expect(error?.errors.username.message).toContain('Path `username` is required');
  });

  it('3. automatically trims whitespace and converts usernames to lowercase', () => {
    const user = new User({ username: '   JohnDoe   ' });

    // The schema strictly defines lowercase: true, trim: true
    expect(user.username).toBe('johndoe');
    expect(user.validateSync()).toBeUndefined();
  });

  it('4. accepts and correctly maps optional fields like lastSeen', () => {
    const testDate = new Date('2024-01-01T00:00:00Z');
    const user = new User({
      username: 'active_user',
      lastSeen: testDate,
      visitCount: 5,
    });

    expect(user.lastSeen).toEqual(testDate);
    expect(user.visitCount).toBe(5);
    expect(user.validateSync()).toBeUndefined();
  });

  it('5. fails validation if incorrect data types are forced into numeric fields', () => {
    // We intentionally provide an uncastable string to a Number field
    const user = new User({
      username: 'invalid_type',
      visitCount: 'not_a_number',
    });

    const error = user.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors.visitCount).toBeDefined();
    expect(error?.errors.visitCount.name).toBe('CastError');
  });
});
