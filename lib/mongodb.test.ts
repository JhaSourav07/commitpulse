import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import dbConnect from './mongodb';

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

describe('dbConnect', () => {
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
  });

  it('throws an error if MONGODB_URI is not defined', async () => {
    delete process.env.MONGODB_URI;

    await expect(dbConnect()).rejects.toThrow(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  });

  it('connects to mongoose and caches the connection', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    const mockMongoose = { connection: 'mock' };
    setConnectedMongoose(mockMongoose as unknown as typeof mongoose);

    const conn1 = await dbConnect();
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test', {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
    });
    expect(conn1).toBe(mockMongoose);

    // Second call should return the cached connection
    const conn2 = await dbConnect();
    expect(mongoose.connect).toHaveBeenCalledTimes(1); // Still 1
    expect(conn2).toBe(mockMongoose);
  });

  it('clears the cached promise if connection fails', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    vi.mocked(mongoose.connect).mockRejectedValue(new Error('Connection Failed'));

    await expect(dbConnect()).rejects.toThrow('Connection Failed');

    // The promise should be cleared so it can try again
    expect(global.mongoose.promise).toBeNull();
  });

  it('calls mongoose.connect with the exact URI set in MONGODB_URI', async () => {
    const specificUri = 'mongodb://specific-host:27017/mydb';
    process.env.MONGODB_URI = specificUri;

    const mockMongoose = { connection: 'mock' };
    setConnectedMongoose(mockMongoose as unknown as typeof mongoose);

    await dbConnect();

    expect(mongoose.connect).toHaveBeenCalledWith(specificUri, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
    });
  });

  it('handles mongoose Connection State 0 (disconnected) gracefully', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    global.mongoose.conn = null;

    vi.mocked(mongoose.connect).mockRejectedValue(new Error('Database is disconnected'));

    await expect(dbConnect()).rejects.toThrow('Database is disconnected');

    // The promise should be cleared so it can try again
    expect(global.mongoose.promise).toBeNull();
  });

  it('throws when called from the Edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    await expect(dbConnect()).rejects.toThrow(
      'MongoDB is not supported in the Edge runtime. Use the Node.js runtime.'
    );

    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it('clears a stale cached connection before reconnecting', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    global.mongoose.conn = {} as typeof mongoose;

    const mockMongoose = { connection: 'mock' };
    setConnectedMongoose(mockMongoose as unknown as typeof mongoose);

    const conn = await dbConnect();

    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(global.mongoose.conn).toBe(mockMongoose);
    expect(conn).toBe(mockMongoose);
  });

  it('handles mongoose Connection State 3 (disconnecting) gracefully by throwing or clearing cache', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    mockMongooseConnection.readyState = 3;

    vi.mocked(mongoose.connect).mockRejectedValue(new Error('Database is disconnecting'));

    await expect(dbConnect()).rejects.toThrow('Database is disconnecting');

    // The promise should be cleared so it can try again
    expect(global.mongoose.promise).toBeNull();
  });
});
