import mongoose from 'mongoose';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { User } from './User';

describe('User Model Schema Behaviors under Connection State 0 (Variation 5)', () => {
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

    vi.clearAllMocks();
  });

  it('rejects delete operations immediately when connection is in state 0 (disconnected) and bufferCommands is disabled', async () => {
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
      await User.deleteOne({ username: 'testuser' }).exec();
    }).rejects.toThrow();
  });

  it('rejects aggregation operations immediately when connection is in state 0 (disconnected) and bufferCommands is disabled', async () => {
    mongoose.set('bufferCommands', false);
    User.schema.set('bufferCommands', false);

    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      configurable: true,
      writable: true,
    });

    expect(mongoose.connection.readyState).toBe(0);

    // Aggregate query must reject immediately
    await expect(async () => {
      await User.aggregate([{ $match: { username: 'testuser' } }]).exec();
    }).rejects.toThrow();
  });

  it('rejects document counting operations immediately when connection is in state 0 (disconnected) and bufferCommands is disabled', async () => {
    mongoose.set('bufferCommands', false);
    User.schema.set('bufferCommands', false);

    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      configurable: true,
      writable: true,
    });

    expect(mongoose.connection.readyState).toBe(0);

    // countDocuments must reject immediately
    await expect(async () => {
      await User.countDocuments({}).exec();
    }).rejects.toThrow();
  });

  it('rejects index creation operations immediately when connection is in state 0 (disconnected) and bufferCommands is disabled', async () => {
    mongoose.set('bufferCommands', false);
    User.schema.set('bufferCommands', false);

    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      configurable: true,
      writable: true,
    });

    expect(mongoose.connection.readyState).toBe(0);

    // Index creation must reject immediately
    await expect(async () => {
      await User.createIndexes();
    }).rejects.toThrow();
  });

  it('allows registering and triggering connection event hooks successfully under connection state 0', () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      configurable: true,
      writable: true,
    });

    expect(mongoose.connection.readyState).toBe(0);

    const listener = vi.fn();
    mongoose.connection.on('disconnected', listener);

    // Emit disconnected event to verify callback triggers under state 0
    mongoose.connection.emit('disconnected');

    expect(listener).toHaveBeenCalledTimes(1);

    // Clean up listener
    mongoose.connection.off('disconnected', listener);
  });
});
