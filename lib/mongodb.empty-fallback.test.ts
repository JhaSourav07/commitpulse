import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import dbConnect, { dbDisconnect } from './mongodb';

const { mockMongooseConnection } = vi.hoisted(() => ({
  mockMongooseConnection: {
    readyState: 0,
  },
}));

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    connection: mockMongooseConnection,
  },
}));

const setConnectedMongoose = (resolvedValue: typeof mongoose) => {
  vi.mocked(mongoose.connect).mockImplementation(async () => {
    mockMongooseConnection.readyState = 1;
    return resolvedValue;
  });
};

describe('mongodb empty-fallback and edge-cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset global cached state
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }

    delete process.env.NEXT_RUNTIME;
    delete process.env.MONGODB_URI;
    mockMongooseConnection.readyState = 0;
  });

  afterEach(() => {
    delete process.env.MONGODB_URI;
    delete process.env.NEXT_RUNTIME;
  });

  describe('MONGODB_URI boundary checks', () => {
    it('should reject when MONGODB_URI is undefined', async () => {
      delete process.env.MONGODB_URI;

      await expect(dbConnect()).rejects.toThrow(
        'Please define the MONGODB_URI environment variable inside .env.local'
      );
      expect(mongoose.connect).not.toHaveBeenCalled();
    });

    it('should reject when MONGODB_URI is an empty string', async () => {
      process.env.MONGODB_URI = '';

      await expect(dbConnect()).rejects.toThrow(
        'Please define the MONGODB_URI environment variable inside .env.local'
      );
      expect(mongoose.connect).not.toHaveBeenCalled();
    });
  });

  describe('dbDisconnect empty state handling', () => {
    it('should resolve immediately and safely when no connection is cached', async () => {
      if (global.mongoose) {
        global.mongoose.conn = null;
        global.mongoose.promise = null;
      }

      await expect(dbDisconnect()).resolves.toBeUndefined();
      expect(mongoose.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('stale connection reset behaviour', () => {
    it('should clear stale cached connection and promise when connection drops (readyState is not 1)', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      const mockMongoose = { connection: 'mock' };
      global.mongoose.conn = mockMongoose as unknown as typeof mongoose;

      // Connection state is 0 (disconnected)
      mockMongooseConnection.readyState = 0;

      setConnectedMongoose(mockMongoose as unknown as typeof mongoose);

      const conn = await dbConnect();

      // It should reset the cache and initiate reconnect
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
      expect(conn).toBe(mockMongoose);
      expect(global.mongoose.conn).toBe(mockMongoose);
    });
  });

  describe('concurrent execution integrity', () => {
    it('should only call mongoose.connect once when concurrent dbConnect calls are made', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      global.mongoose.conn = null;
      global.mongoose.promise = null;

      const mockMongoose = { connection: 'mock' };
      setConnectedMongoose(mockMongoose as unknown as typeof mongoose);

      // Concurrent invocations
      const [conn1, conn2] = await Promise.all([dbConnect(), dbConnect()]);

      expect(conn1).toBe(mockMongoose);
      expect(conn2).toBe(mockMongoose);
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge runtime boundary verification', () => {
    it('should throw immediately when NEXT_RUNTIME is edge, even if connection cache is already populated', async () => {
      vi.stubEnv('NEXT_RUNTIME', 'edge');
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      const mockMongoose = { connection: 'mock' };
      global.mongoose.conn = mockMongoose as unknown as typeof mongoose;
      mockMongooseConnection.readyState = 1;

      await expect(dbConnect()).rejects.toThrow(
        'MongoDB is not supported in the Edge runtime. Use the Node.js runtime.'
      );
      expect(mongoose.connect).not.toHaveBeenCalled();
    });
  });
});
