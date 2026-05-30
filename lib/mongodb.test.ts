import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import dbConnect from './mongodb';

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

describe('dbConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset global cache
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }
  });

  afterEach(() => {
    delete process.env.MONGODB_URI;
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
    vi.mocked(mongoose.connect).mockResolvedValue(mockMongoose as unknown as typeof mongoose);

    const conn1 = await dbConnect();
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test', {
      bufferCommands: false,
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
    vi.mocked(mongoose.connect).mockResolvedValue(mockMongoose as unknown as typeof mongoose);

    await dbConnect();

    expect(mongoose.connect).toHaveBeenCalledWith(specificUri, {
      bufferCommands: false,
    });
  });
});
