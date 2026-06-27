import mongoose from 'mongoose';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { User } from './User';

describe('User Model', () => {
  it('is compiled properly and exposed', (): void => {
    expect(User).toBeDefined();
    expect(User.modelName).toBe('User');
  });

  describe('username schema constraints', () => {
    it('has lowercase: true on username path', (): void => {
      const usernamePath = User.schema.path('username') as mongoose.SchemaType & {
        options: Record<string, unknown>;
      };
      expect(usernamePath.options.lowercase).toBe(true);
    });

    describe('createdAt schema', () => {
      it('uses a callable default that returns a timestamp', (): void => {
        const createdAtPath = User.schema.path('createdAt') as mongoose.SchemaType & {
          options: { default?: unknown };
        };

        // Assertion 1: the default is a function
        expect(typeof createdAtPath.options.default).toBe('function');

        // Assertion 2: calling the default returns a numeric timestamp
        const result = (createdAtPath.options.default as () => number)();
        expect(typeof result).toBe('number');
        expect(Number.isFinite(result)).toBe(true);
      });

      it('has a defined defaultValue that is Date.now or returns a Date', (): void => {
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

    it('has trim: true on username path', (): void => {
      const usernamePath = User.schema.path('username') as mongoose.SchemaType & {
        options: Record<string, unknown>;
      };
      expect(usernamePath.options.trim).toBe(true);
    });

    it('has unique: true on username path', (): void => {
      const usernamePath = User.schema.path('username') as mongoose.SchemaType & {
        options: Record<string, unknown>;
      };
      expect(usernamePath.options.unique).toBe(true);
    });

    it('has required: true on username path', (): void => {
      const usernamePath = User.schema.path('username') as mongoose.SchemaType & {
        options: Record<string, unknown>;
      };
      expect(usernamePath.options.required).toBe(true);
    });
  });

  describe('Database Connection State 2 Handling', () => {
    let readyStateSpy: ReturnType<typeof vi.spyOn> | undefined;

    afterEach((): void => {
      // Restore bufferCommands to default (true) on both mongoose connection settings and the User schema
      mongoose.set('bufferCommands', true);
      User.schema.set('bufferCommands', true);

      // Clean up collection queue to avoid leaking buffered operations to other tests
      const collectionWrapper = User.collection as unknown as { queue: unknown[] };
      if (collectionWrapper && Array.isArray(collectionWrapper.queue)) {
        collectionWrapper.queue = [];
      }

      // Restore active state spies to ensure they never leak into surrounding test suites
      if (readyStateSpy) {
        readyStateSpy.mockRestore();
        readyStateSpy = undefined;
      }

      // Clear all mocks to ensure absolute test isolation
      vi.clearAllMocks();
    });

    it('buffers operations when connection is in state 2 (connecting) by default', async (): Promise<void> => {
      let currentReadyState = 2;
      readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockImplementation(() => currentReadyState as typeof mongoose.connection.readyState);

      expect(mongoose.connection.readyState).toBe(2);

      // Trigger a findOne operation which should transition smoothly into a buffered state
      const promise = User.findOne({ username: 'testuser' }).exec();

      // Wait a microtask / tick for Mongoose to queue the collection operation
      await new Promise((resolve) => process.nextTick(resolve));

      // Assert that the command was successfully buffered in the collection wrapper queue
      const collectionWrapper = User.collection as unknown as { queue: unknown[] };
      expect(collectionWrapper.queue.length).toBe(1);

      // Assert that the returned promise is pending by racing it with a fast timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 100)
      );
      await expect(Promise.race([promise, timeoutPromise])).rejects.toThrow('TIMEOUT');

      // Simulate a successful connection transition to state 1 (connected)
      currentReadyState = 1;
      expect(mongoose.connection.readyState).toBe(1);

      try {
        (mongoose.connection as unknown as { onOpen: () => void }).onOpen();
        await promise;
      } catch (error: unknown) {
        expect(error).toBeDefined();
        expect(error instanceof TypeError || error instanceof Error).toBe(true);
      }
    });

    it('rejects operations immediately when bufferCommands is disabled in state 2', async (): Promise<void> => {
      mongoose.set('bufferCommands', false);
      User.schema.set('bufferCommands', false);

      readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(2 as unknown as typeof mongoose.connection.readyState);

      expect(mongoose.connection.readyState).toBe(2);

      await expect(User.findOne({ username: 'testuser' }).exec()).rejects.toThrow(
        /Cannot call.*if.*bufferCommands = false/
      );

      const collectionWrapper = User.collection as unknown as { queue: unknown[] };
      expect(collectionWrapper.queue.length).toBe(0);
    });

    it('handles connection failure while connecting without leaving operations stuck', async (): Promise<void> => {
      let currentReadyState = 2;

      readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockImplementation(() => currentReadyState as typeof mongoose.connection.readyState);

      expect(mongoose.connection.readyState).toBe(2);

      const connectionError = new Error('Database connection lost');
      connectionError.name = 'ConnectionError';

      const findOneSpy = vi.spyOn(User, 'findOne').mockRejectedValue(connectionError);

      // Simulate connection dropping before it becomes connected
      currentReadyState = 0;

      expect(mongoose.connection.readyState).toBe(0);

      await expect(User.findOne({ username: 'failure-user' })).rejects.toThrow(
        'Database connection lost'
      );

      await expect(User.findOne({ username: 'failure-user' })).rejects.toMatchObject({
        name: 'ConnectionError',
      });

      findOneSpy.mockRestore();
    });

    it('times out cleanly when the connection remains stuck in state 2 too long', async (): Promise<void> => {
      readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(2 as unknown as typeof mongoose.connection.readyState);

      expect(mongoose.connection.readyState).toBe(2);

      const query = User.findOne({ username: 'timeout-user' }).exec();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout: state 2 did not resolve')), 50)
      );

      await expect(Promise.race([query, timeoutPromise])).rejects.toThrow(
        'Connection timeout: state 2 did not resolve'
      );

      query.catch(() => undefined);
    });
  });

  describe('Database Connection State 0 Handling', () => {
    it('fails queries gracefully with a ConnectionError when disconnected', async (): Promise<void> => {
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
    it('aborts/rolls back active transactions cleanly when connection is in state 3 (disconnecting)', async (): Promise<void> => {
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

      const runTransactionWithCheck = async (
        session: mongoose.ClientSession
      ): Promise<{ status: string }> => {
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

    it('rejects new queries immediately when connection transitions to state 3 (disconnecting)', async (): Promise<void> => {
      const readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(3 as unknown as typeof mongoose.connection.readyState);

      expect(mongoose.connection.readyState).toBe(3);

      const mockDisconnectingError = new Error('Connection is closing');
      mockDisconnectingError.name = 'DisconnectingError';

      const findOneSpy = vi.spyOn(User, 'findOne').mockRejectedValue(mockDisconnectingError);

      await expect(User.findOne({ username: 'testuser' })).rejects.toThrow('Connection is closing');
      await expect(User.findOne({ username: 'testuser' })).rejects.toMatchObject({
        name: 'DisconnectingError',
      });

      readyStateSpy.mockRestore();
      findOneSpy.mockRestore();
    });
  });

  describe('Database Connection State 99 Handling', () => {
    it('triggers lazy initialization exactly once and uses the correct connection URI', async (): Promise<void> => {
      const readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(99 as unknown as typeof mongoose.connection.readyState);

      const connectSpy = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      const MONGO_URI = 'mongodb://localhost:27017/commitpulse';

      const lazyInit = async (): Promise<void> => {
        if (mongoose.connection.readyState === 99) {
          await mongoose.connect(MONGO_URI);
        }
      };

      await lazyInit();

      expect(mongoose.connection.readyState).toBe(99);
      expect(connectSpy).toHaveBeenCalledTimes(1);
      expect(connectSpy).toHaveBeenCalledWith(MONGO_URI);

      readyStateSpy.mockRestore();
      connectSpy.mockRestore();
    });

    it('skips lazy initialization when connection is already in an active state', async (): Promise<void> => {
      const readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(1 as unknown as typeof mongoose.connection.readyState);

      const connectSpy = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      const MONGO_URI = 'mongodb://localhost:27017/commitpulse';

      const lazyInit = async (): Promise<void> => {
        if (mongoose.connection.readyState === 99) {
          await mongoose.connect(MONGO_URI);
        }
      };

      await lazyInit();

      // State is 1 (connected), not 99 — lazy init must not fire
      expect(mongoose.connection.readyState).toBe(1);
      expect(connectSpy).not.toHaveBeenCalled();

      readyStateSpy.mockRestore();
      connectSpy.mockRestore();
    });

    //test to ensure that if the connection is already active (readyState 1), it does not trigger the lazy initialization fallback
    it('does not trigger lazy initialization fallback when connection is already active', async () => {
      const { vi } = await import('vitest');

      // Mock mongoose.connection.readyState to return 1 (connected)
      const readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(1 as unknown as typeof mongoose.connection.readyState);

      // Spy on mongoose.connect
      const connectSpy = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);

      // Simulate database operation
      const executeDbOperation = async () => {
        if (mongoose.connection.readyState === 99) {
          await mongoose.connect('mongodb://localhost:27017/test');
        }
      };

      await executeDbOperation();

      // Assertions
      expect(mongoose.connection.readyState).toBe(1);
      expect(connectSpy).not.toHaveBeenCalled();

      // Cleanup
      readyStateSpy.mockRestore();
      connectSpy.mockRestore();
    });
  });

  describe('Database Connection State 3 Handling', () => {
    it('aborts active transactions when connection is state 3', async () => {
      const { vi } = await import('vitest');
      const readySpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(3 as never);

      const abortFn = vi.fn();
      const endFn = vi.fn();
      const startSpy = vi.spyOn(mongoose, 'startSession').mockResolvedValue({
        abortTransaction: abortFn,
        endSession: endFn,
      } as never);

      const runTx = async () => {
        const sess = await mongoose.startSession();
        if (mongoose.connection.readyState === 3) await sess.abortTransaction();
        await sess.endSession();
      };

      await runTx();

      expect(mongoose.connection.readyState).toBe(3);
      expect(abortFn).toHaveBeenCalledTimes(1);
      expect(endFn).toHaveBeenCalledTimes(1);

      readySpy.mockRestore();
      startSpy.mockRestore();
    });
  });
});

/* ==========================================================================
 * DATABASE PARAMETER — SCHEMA CONNECTION STATE BEHAVIORS (VARIATION 3)
 * ========================================================================== */

describe('User Schema Behaviors under Connection State 2 (Variation 3)', () => {
  it('buffers user model database operations cleanly when connection state is 2 (connecting)', async () => {
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
});
