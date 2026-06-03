import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';

// Mock mongoose before importing dbConnect
vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    connection: {
      readyState: 0,
    },
  },
}));

describe('MongoDB Connection Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env and mocks before each test
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    
    // Reset global mongoose cache
    global.mongoose = { conn: null, promise: null, unavailable: false };
    
    // Reset mongoose connection state
    (mongoose.connection as any).readyState = 0;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isMongoDBAvailable', () => {
    it('should return true when MONGODB_URI is set', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      
      // Dynamic import to get fresh module state
      const { isMongoDBAvailable } = await import('./mongodb');
      
      expect(isMongoDBAvailable()).toBe(true);
    });

    it('should return false when MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;
      
      const { isMongoDBAvailable } = await import('./mongodb');
      
      expect(isMongoDBAvailable()).toBe(false);
    });

    it('should return false when MONGODB_URI is empty string', async () => {
      process.env.MONGODB_URI = '';
      
      const { isMongoDBAvailable } = await import('./mongodb');
      
      expect(isMongoDBAvailable()).toBe(false);
    });

    it('should return false when MONGODB_URI is whitespace only', async () => {
      process.env.MONGODB_URI = '   ';
      
      const { isMongoDBAvailable } = await import('./mongodb');
      
      expect(isMongoDBAvailable()).toBe(false);
    });
  });

  describe('dbConnect', () => {
    it('should throw error in Edge runtime', async () => {
      process.env.NEXT_RUNTIME = 'edge';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      
      const { default: dbConnect } = await import('./mongodb');
      
      await expect(dbConnect()).rejects.toThrow('MongoDB is not supported in the Edge runtime');
    });

    it('should throw descriptive error when MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;
      delete process.env.NEXT_RUNTIME;
      
      const { default: dbConnect } = await import('./mongodb');
      
      await expect(dbConnect()).rejects.toThrow('MongoDB is not configured');
      await expect(dbConnect()).rejects.toThrow('MONGODB_URI is optional');
    });

    it('should mark MongoDB as unavailable after first failed attempt', async () => {
      delete process.env.MONGODB_URI;
      delete process.env.NEXT_RUNTIME;
      
      const { default: dbConnect } = await import('./mongodb');
      
      // First call should throw
      await expect(dbConnect()).rejects.toThrow();
      
      // Second call should throw with unavailable message
      await expect(dbConnect()).rejects.toThrow('MongoDB is not available');
    });

    it('should connect successfully when MONGODB_URI is set', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      delete process.env.NEXT_RUNTIME;
      
      const mockMongooseInstance = { connection: { readyState: 1 } };
      vi.mocked(mongoose.connect).mockResolvedValue(mockMongooseInstance as any);
      
      const { default: dbConnect } = await import('./mongodb');
      
      const result = await dbConnect();
      
      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test',
        expect.objectContaining({
          bufferCommands: false,
          maxPoolSize: 10,
          minPoolSize: 0,
        })
      );
      expect(result).toBeDefined();
    });

    it('should reuse existing connection when already connected', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      delete process.env.NEXT_RUNTIME;
      
      const mockMongooseInstance = { connection: { readyState: 1 } };
      vi.mocked(mongoose.connect).mockResolvedValue(mockMongooseInstance as any);
      
      // Set up existing connection
      global.mongoose = {
        conn: mockMongooseInstance as any,
        promise: null,
      };
      (mongoose.connection as any).readyState = 1;
      
      const { default: dbConnect } = await import('./mongodb');
      
      const result = await dbConnect();
      
      // Should return cached connection without calling connect again
      expect(mongoose.connect).not.toHaveBeenCalled();
      expect(result).toBe(mockMongooseInstance);
    });

    it('should reset cache if connection dropped', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      delete process.env.NEXT_RUNTIME;
      
      const oldConnection = { connection: { readyState: 0 } };
      const newConnection = { connection: { readyState: 1 } };
      
      // Set up dropped connection
      global.mongoose = {
        conn: oldConnection as any,
        promise: null,
      };
      (mongoose.connection as any).readyState = 0;
      
      vi.mocked(mongoose.connect).mockResolvedValue(newConnection as any);
      
      const { default: dbConnect } = await import('./mongodb');
      
      await dbConnect();
      
      // Should create new connection
      expect(mongoose.connect).toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      delete process.env.NEXT_RUNTIME;
      
      const connectionError = new Error('Connection failed');
      vi.mocked(mongoose.connect).mockRejectedValue(connectionError);
      
      const { default: dbConnect } = await import('./mongodb');
      
      await expect(dbConnect()).rejects.toThrow('Connection failed');
      
      // Cache should be cleared after error
      expect(global.mongoose.promise).toBeNull();
    });
  });

  describe('dbDisconnect', () => {
    it('should disconnect and clear cache', async () => {
      const mockConnection = { connection: { readyState: 1 } };
      global.mongoose = {
        conn: mockConnection as any,
        promise: Promise.resolve(mockConnection as any),
      };
      
      vi.mocked(mongoose.disconnect).mockResolvedValue();
      
      const { dbDisconnect } = await import('./mongodb');
      
      await dbDisconnect();
      
      expect(mongoose.disconnect).toHaveBeenCalled();
      expect(global.mongoose.conn).toBeNull();
      expect(global.mongoose.promise).toBeNull();
    });

    it('should reset unavailable flag on disconnect', async () => {
      global.mongoose = {
        conn: null,
        promise: null,
        unavailable: true,
      };
      
      const { dbDisconnect } = await import('./mongodb');
      
      await dbDisconnect();
      
      expect(global.mongoose.unavailable).toBe(false);
    });

    it('should handle disconnect when no connection exists', async () => {
      global.mongoose = { conn: null, promise: null };
      
      const { dbDisconnect } = await import('./mongodb');
      
      await expect(dbDisconnect()).resolves.not.toThrow();
      expect(mongoose.disconnect).not.toHaveBeenCalled();
    });
  });
});
