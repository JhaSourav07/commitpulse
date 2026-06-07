import mongoose from 'mongoose';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { User } from './User';

describe('User Model Schema Behaviors under Connection State 0 (Variation 4)', () => {
  let originalReadyState: number;

  beforeEach(() => {
    originalReadyState = mongoose.connection.readyState;
  });

  afterEach(() => {
    // Restore settings
    mongoose.set('bufferCommands', true);
    User.schema.set('bufferCommands', true);

    // Restore readyState
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: originalReadyState,
      configurable: true,
      writable: true,
    });
  });

  it('rejects queries immediately when connection is in state 0 (disconnected) and bufferCommands is disabled', async () => {
    mongoose.set('bufferCommands', false);
    User.schema.set('bufferCommands', false);

    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      configurable: true,
      writable: true,
    });

    expect(mongoose.connection.readyState).toBe(0);

    // Operation must reject immediately due to disabled bufferCommands
    await expect(async () => {
      await User.findOne({ username: 'testuser' }).exec();
    }).rejects.toThrow();
  });

  it('rejects document save operations immediately when connection is in state 0 and bufferCommands is disabled', async () => {
    mongoose.set('bufferCommands', false);
    User.schema.set('bufferCommands', false);

    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      configurable: true,
      writable: true,
    });

    expect(mongoose.connection.readyState).toBe(0);

    const testUserDoc = new User({ username: 'save-test-user' });

    // Save must reject immediately
    await expect(async () => {
      await testUserDoc.save();
    }).rejects.toThrow();
  });

  it('rejects update queries immediately when connection is in state 0 and bufferCommands is disabled', async () => {
    mongoose.set('bufferCommands', false);
    User.schema.set('bufferCommands', false);

    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      configurable: true,
      writable: true,
    });

    expect(mongoose.connection.readyState).toBe(0);

    // Update operation must reject immediately
    await expect(async () => {
      await User.updateOne({ username: 'testuser' }, { visitCount: 5 }).exec();
    }).rejects.toThrow();
  });

  it('rejects session creation immediately when connection is in state 0 and bufferCommands is disabled', async () => {
    mongoose.set('bufferCommands', false);
    User.schema.set('bufferCommands', false);

    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      configurable: true,
      writable: true,
    });

    expect(mongoose.connection.readyState).toBe(0);

    // Session creation must reject immediately
    await expect(async () => {
      await mongoose.startSession();
    }).rejects.toThrow();
  });

  it('retrieves schema constraints successfully when disconnected (state 0) without triggering active queries', () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      configurable: true,
      writable: true,
    });

    expect(mongoose.connection.readyState).toBe(0);

    // Test that schema properties can be inspected statically even without active connection
    const usernamePath = User.schema.path('username') as mongoose.SchemaType & {
      options: {
        required?: boolean | string | [boolean, string];
        unique?: boolean;
        lowercase?: boolean;
        trim?: boolean;
      };
    };
    expect(usernamePath).toBeDefined();
    expect(usernamePath.options.required).toBe(true);
    expect(usernamePath.options.unique).toBe(true);
    expect(usernamePath.options.lowercase).toBe(true);
    expect(usernamePath.options.trim).toBe(true);
  });
});
