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

        // Assertion 1: the default is a function
        expect(typeof createdAtPath.options.default).toBe('function');

        // Assertion 2: calling the default returns a numeric timestamp
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
    it('keeps the User model usable while mongoose is connecting', async () => {
      const { vi } = await import('vitest');

      const readyStateSpy = vi
        .spyOn(mongoose.connection, 'readyState', 'get')
        .mockReturnValue(2 as unknown as typeof mongoose.connection.readyState);

      expect(mongoose.connection.readyState).toBe(2);
      expect(User).toBeDefined();
      expect(User.modelName).toBe('User');

      const usernamePath = User.schema.path('username') as mongoose.SchemaType & {
        options: Record<string, unknown>;
      };

      expect(usernamePath.options.required).toBe(true);
      expect(usernamePath.options.unique).toBe(true);
      expect(usernamePath.options.lowercase).toBe(true);
      expect(usernamePath.options.trim).toBe(true);

      readyStateSpy.mockRestore();
    });
  });
});
