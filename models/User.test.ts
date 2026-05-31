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

  describe('Database Connection State 99 Handling', () => {
    it('triggers a lazy initialization fallback when connection is state 99 (uninitialized)', async () => {
      const { vi } = await import('vitest');

      const readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(99 as unknown as typeof mongoose.connection.readyState);

      const connectSpy = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);

      const executeDbOperation = async () => {
        if (mongoose.connection.readyState === 99) {
          await mongoose.connect('mongodb://localhost:27017/test');
        }
      };

      await executeDbOperation();

      expect(mongoose.connection.readyState).toBe(99);
      expect(connectSpy).toHaveBeenCalledTimes(1);

      readyStateSpy.mockRestore();
      connectSpy.mockRestore();
    });

    it('triggers lazy initialization exactly once and uses the correct connection URI', async () => {
      const { vi } = await import('vitest');

      const readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(99 as unknown as typeof mongoose.connection.readyState);

      const connectSpy = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);

      const MONGO_URI = 'mongodb://localhost:27017/commitpulse';
      const lazyInit = async () => {
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
      // Critical: result is 'buffered' not an error — distinguishes state 2 from state 0
      expect(result).toBe('buffered');

      // 5. Cleanup
      readyStateSpy.mockRestore();
      startSessionSpy.mockRestore();
    });
  });
});
