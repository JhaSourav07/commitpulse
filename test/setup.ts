import { afterEach } from 'vitest';
import { installTimezoneMock, resetMockTimezone } from './timezone';
import { createFramerMotionMock } from './framer-motion';

const localStorageMemory = (() => {
  const store: Record<string, string> = {};

  return {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
    },
  };
})();

installTimezoneMock();

Object.defineProperty(globalThis, '__framerMotionMock', {
  configurable: true,
  enumerable: false,
  writable: false,
  value: createFramerMotionMock(),
});

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: localStorageMemory,
});

afterEach(() => {
  resetMockTimezone();
  localStorageMemory.clear();
});
