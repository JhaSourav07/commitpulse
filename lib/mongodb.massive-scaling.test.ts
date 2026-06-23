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

describe('mongodb - Massive Data Sets and Extreme High Bounds Scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset global cache
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
    vi.unstubAllEnvs();
  });

  it('Case 1: handles thousands of concurrent dbConnect requests safely and reuses the in-flight promise', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/stress-test';
    const mockMongoose = { connection: 'mock' };
    setConnectedMongoose(mockMongoose as unknown as typeof mongoose);

    // Call dbConnect 2000 times concurrently
    const calls = Array.from({ length: 2000 }, () => dbConnect());
    const connections = await Promise.all(calls);

    // Verify all resolved connection objects are identical
    connections.forEach((conn) => {
      expect(conn).toBe(mockMongoose);
    });

    // Verify mongoose.connect was called exactly once
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });

  it('Case 2: measures consecutive cache lookup latency under high request volume', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/stress-test';
    const mockMongoose = { connection: 'mock' };

    // Set cached state in global cache directly
    global.mongoose.conn = mockMongoose as unknown as typeof mongoose;
    mockMongooseConnection.readyState = 1;

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      const conn = await dbConnect();
      expect(conn).toBe(mockMongoose);
    }
    const duration = performance.now() - start;

    // 10,000 consecutive lookups should be extremely fast (well under 500ms)
    expect(duration).toBeLessThan(500);
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it('Case 3: verifies that connection options are correctly forwarded under massive scale MONGODB_URI structures', async () => {
    // Generate a massive URI with 100 replica sets / params (e.g. simulating a massive sharded cluster setup)
    const complexParams = Array.from(
      { length: 100 },
      (_, i) => `replica-${i}.domain.com:27017`
    ).join(',');
    const massiveUri = `mongodb://${complexParams}/mydb?authSource=admin&replicaSet=massiveSet&w=majority&maxPoolSize=10000`;
    process.env.MONGODB_URI = massiveUri;

    const mockMongoose = { connection: 'mock' };
    setConnectedMongoose(mockMongoose as unknown as typeof mongoose);

    const conn = await dbConnect();
    expect(conn).toBe(mockMongoose);

    // Verify connect options structure is correct and URI was forwarded exactly
    expect(mongoose.connect).toHaveBeenCalledWith(massiveUri, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
    });
  });

  it('Case 4: rejects concurrently called dbConnect requests in the Edge runtime environment defensively', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    process.env.MONGODB_URI = 'mongodb://localhost:27017/stress-test';

    const calls = Array.from({ length: 1000 }, () => dbConnect());
    const results = await Promise.allSettled(calls);

    results.forEach((res) => {
      expect(res.status).toBe('rejected');
      if (res.status === 'rejected') {
        expect(res.reason.message).toContain('Edge runtime');
      }
    });

    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it('Case 5: maintains cached state integrity under rapid reconnect and teardown cycles', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/stress-test';
    const mockMongoose = { connection: 'mock' };

    let connectCallCount = 0;
    vi.mocked(mongoose.connect).mockImplementation(async () => {
      connectCallCount++;
      mockMongooseConnection.readyState = 1;
      return mockMongoose as unknown as typeof mongoose;
    });

    vi.mocked(mongoose.disconnect).mockImplementation(async () => {
      mockMongooseConnection.readyState = 0;
    });

    // Run 100 cycles of connect -> disconnect
    for (let i = 0; i < 100; i++) {
      const conn = await dbConnect();
      expect(conn).toBe(mockMongoose);
      expect(global.mongoose.conn).toBe(mockMongoose);
      expect(mockMongooseConnection.readyState).toBe(1);

      await dbDisconnect();
      expect(global.mongoose.conn).toBeNull();
      expect(global.mongoose.promise).toBeNull();
    }

    expect(connectCallCount).toBe(100);
    expect(mongoose.disconnect).toHaveBeenCalledTimes(100);
  });
});
