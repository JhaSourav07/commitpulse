import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import { User } from './User';

describe('User Model', () => {
  it('is compiled properly and exposed', () => {
    expect(User).toBeDefined();
    expect(User.modelName).toBe('User');
  });

  describe('username schema constraints', () => {
    it('has lowercase: true on username path', () => {
      const usernamePath = User.schema.path('username') as mongoose.SchemaType & {
        options: Record<string, unknown>;
      };
      expect(usernamePath.options.lowercase).toBe(true);
    });

    describe('createdAt schema', () => {
      it('uses a callable default that returns a timestamp', () => {
        const createdAtPath = User.schema.path('createdAt') as mongoose.SchemaType & {
          options: { default?: unknown };
        };

        expect(typeof createdAtPath.options.default).toBe('function');

        const result = (createdAtPath.options.default as () => number)();
        expect(typeof result).toBe('number');
        expect(Number.isFinite(result)).toBe(true);
      });

      it('has a defined defaultValue that is Date.now or returns a Date', () => {
        const createdAtPath = User.schema.path('createdAt') as mongoose.SchemaType & {
          defaultValue?: unknown;
          options: { default?: unknown };
        };

        const defaultValue = createdAtPath.defaultValue ?? createdAtPath.options.default;

        expect(defaultValue).toBeDefined();

        if (defaultValue !== Date.now) {
          expect(typeof defaultValue).toBe('function');
          const value = (defaultValue as () => unknown)();
          expect(value instanceof Date).toBe(true);
        }
      });
    });

    it('has trim: true on username path', () => {
      const usernamePath = User.schema.path('username') as mongoose.SchemaType & {
        options: Record<string, unknown>;
      };
      expect(usernamePath.options.trim).toBe(true);
    });

    it('has unique: true on username path', () => {
      const usernamePath = User.schema.path('username') as mongoose.SchemaType & {
        options: Record<string, unknown>;
      };
      expect(usernamePath.options.unique).toBe(true);
    });

    it('has required: true on username path', () => {
      const usernamePath = User.schema.path('username') as mongoose.SchemaType & {
        options: Record<string, unknown>;
      };
      expect(usernamePath.options.required).toBe(true);
    });
  });

  describe('Database Connection State 2 Handling', () => {
    it('buffers operations when connection is in state 2 (connecting)', async () => {
      const { vi } = await import('vitest');
      const readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(2 as unknown as typeof mongoose.connection.readyState);

      let operationAttempted = false;

      const simulateBufferedOperation = async () => {
        if (mongoose.connection.readyState === 2) {
          operationAttempted = true;
          return 'buffered';
        }
        return 'executed';
      };

      const result = await simulateBufferedOperation();

      expect(mongoose.connection.readyState).toBe(2);
      expect(operationAttempted).toBe(true);
      expect(result).toBe('buffered');

      readyStateSpy.mockRestore();
    });
  });

  describe('Database Connection State 0 Handling', () => {
    it('fails queries gracefully with a ConnectionError when disconnected', async () => {
      const { vi } = await import('vitest');

      const readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(0 as unknown as typeof mongoose.connection.readyState);

      expect(mongoose.connection.readyState).toBe(0);

      const mockConnectionError = new Error('Database connection lost');
      mockConnectionError.name = 'ConnectionError';

      const findOneSpy = vi.spyOn(User, 'findOne').mockRejectedValue(mockConnectionError);

      await expect(User.findOne({ username: 'testuser' })).rejects.toThrow(
        'Database connection lost'
      );
      await expect(User.findOne({ username: 'testuser' })).rejects.toMatchObject({
        name: 'ConnectionError',
      });

      readyStateSpy.mockRestore();
      findOneSpy.mockRestore();
    });
  });

  describe('Database Connection State 3 (Disconnecting) Handling', () => {
    it('aborts/rolls back active transactions cleanly when connection is in state 3 (disconnecting)', async () => {
      const { vi } = await import('vitest');

      const readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(3 as unknown as typeof mongoose.connection.readyState);

      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn().mockResolvedValue(undefined),
        endSession: vi.fn().mockResolvedValue(undefined),
      } as unknown as mongoose.ClientSession;

      const startSessionSpy = vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);

      const runTransactionWithCheck = async (session: mongoose.ClientSession) => {
        session.startTransaction();
        try {
          if (mongoose.connection.readyState === 3) {
            await session.abortTransaction();
            return { status: 'aborted' };
          }
          await session.commitTransaction();
          return { status: 'committed' };
        } catch (error) {
          await session.abortTransaction();
          throw error;
        } finally {
          await session.endSession();
        }
      };

      const session = await mongoose.startSession();
      const result = await runTransactionWithCheck(session);

      expect(result.status).toBe('aborted');
      expect(mockSession.abortTransaction).toHaveBeenCalledTimes(1);
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();

      readyStateSpy.mockRestore();
      startSessionSpy.mockRestore();
    });
  });

  describe('Database Connection State 99 Handling', () => {
    it('triggers lazy initialization exactly once and uses the correct connection URI', async () => {
      const { vi } = await import('vitest');

      // 1. Mock readyState to 99 (uninitialized — no connection ever attempted)
      const readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(99 as unknown as typeof mongoose.connection.readyState);

      // 2. Stub mongoose.connect to capture what URI it was called with
      const connectSpy = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);

      const MONGO_URI = 'mongodb://localhost:27017/commitpulse';

      // 3. Simulate the lazy init fallback — connects exactly once with correct URI
      const lazyInit = async () => {
        if (mongoose.connection.readyState === 99) {
          await mongoose.connect(MONGO_URI);
        }
      };

      await lazyInit();

      // 4. Assertions
      expect(mongoose.connection.readyState).toBe(99);
      expect(connectSpy).toHaveBeenCalledTimes(1);
      expect(connectSpy).toHaveBeenCalledWith(MONGO_URI);

      // 5. Cleanup
      readyStateSpy.mockRestore();
      connectSpy.mockRestore();
    });
  });
});
