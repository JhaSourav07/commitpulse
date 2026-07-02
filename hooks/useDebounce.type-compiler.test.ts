import { describe, it, expectTypeOf } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce TypeScript Compiler & Schema Constraints', () => {
  it('1. enforces exact return type matching the input generic type', () => {
    const { result } = renderHook(() => useDebounce<string>('search query', 500));

    expectTypeOf(result.current).toEqualTypeOf<string>();
    expectTypeOf(result.current).not.toEqualTypeOf<number>();
  });

  it('2. accepts complex object schemas and preserves property configurations', () => {
    interface UserSchema {
      id: number;
      username: string;
      isActive: boolean;
    }

    const mockUser: UserSchema = { id: 1, username: 'admin', isActive: true };
    const { result } = renderHook(() => useDebounce(mockUser, 300));

    expectTypeOf(result.current).toEqualTypeOf<UserSchema>();
    expectTypeOf(result.current).toHaveProperty('id').toBeNumber();
    expectTypeOf(result.current).toHaveProperty('username').toBeString();
    expectTypeOf(result.current).toHaveProperty('isActive').toBeBoolean();
  });

  it('3. blocks invalid prop parameters during static type checking', () => {
    // The @ts-expect-error directive asserts that the TS compiler throws an error on the next line.

    // @ts-expect-error - delay must be a number, not a string
    renderHook(() => useDebounce('test', '500'));

    // @ts-expect-error - requires at least 1 argument
    renderHook(() => useDebounce());
  });

  it('4. verifies custom types accept optional values without compile errors', () => {
    type ConfigSchema = { theme: string; retries?: number };

    const partialConfig: ConfigSchema = { theme: 'dark' }; // 'retries' is optional
    const { result } = renderHook(() => useDebounce(partialConfig, 250));

    expectTypeOf(result.current).toEqualTypeOf<ConfigSchema>();
    expectTypeOf(result.current).toHaveProperty('theme').toBeString();
    // Validates the compiler knows this field might be undefined
    expectTypeOf(result.current).toHaveProperty('retries').toEqualTypeOf<number | undefined>();
  });

  it('5. enforces strict type narrowing for literal types (strict validation reports)', () => {
    type Status = 'idle' | 'loading' | 'success' | 'error';

    const currentStatus: Status = 'loading';
    const { result } = renderHook(() => useDebounce<Status>(currentStatus, 150));

    expectTypeOf(result.current).toEqualTypeOf<Status>();
    expectTypeOf(result.current).not.toEqualTypeOf<string>();
  });
});
