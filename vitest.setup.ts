import React from 'react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { motion } from 'framer-motion';

// Custom Storage prototype override to fix Node.js v25+ experimental localStorage incompatibility with JSDOM
if (typeof window !== 'undefined' && typeof window.Storage !== 'undefined') {
  const stores = new WeakMap<object, Map<string, string>>();

  const getStore = (instance: object) => {
    let store = stores.get(instance);
    if (!store) {
      store = new Map<string, string>();
      stores.set(instance, store);
    }
    return store;
  };

  Object.defineProperty(window.Storage.prototype, 'length', {
    get() {
      return getStore(this).size;
    },
    configurable: true,
  });

  window.Storage.prototype.getItem = function (key: string) {
    return getStore(this).get(key) ?? null;
  };

  window.Storage.prototype.setItem = function (key: string, value: string) {
    getStore(this).set(key, String(value));
  };

  window.Storage.prototype.removeItem = function (key: string) {
    getStore(this).delete(key);
  };

  window.Storage.prototype.clear = function () {
    getStore(this).clear();
  };

  window.Storage.prototype.key = function (index: number) {
    return Array.from(getStore(this).keys())[index] ?? null;
  };

  // Re-create localStorage and sessionStorage to be genuine Storage instances
  const mockLocalStorage = Object.create(window.Storage.prototype);
  const mockSessionStorage = Object.create(window.Storage.prototype);

  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });
}
const MOTION_PROPS = new Set([
  'animate',
  'initial',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'whileInView',
  'viewport',
  'layout',
  'layoutId',
  'drag',
  'dragConstraints',
]);

function stripMotionProps(props: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)));
}

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => {
    children;
  },

  motion: new Proxy(
    {},
    {
      get: (_target, tag: string | symbol) => {
        const element = typeof tag === 'string' ? tag : 'div';

        return ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
          const safeProps = stripMotionProps(props);

          return React.createElement(element, safeProps, children);
        };
      },
    }
  ),
}));
