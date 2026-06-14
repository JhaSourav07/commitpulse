import { vi } from 'vitest';
import '@testing-library/jest-dom';

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
vi.mock('framer-motion', async () => {
  const React = await import('react');

  const motionProps = new Set([
    'whileHover',
    'whileTap',
    'whileInView',
    'initial',
    'animate',
    'exit',
    'variants',
    'transition',
    'viewport',
    'drag',
    'layout',
    'layoutId',
  ]);

  const stripMotionProps = (props: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(props).filter(([key]) => !motionProps.has(key)));

  const createMotionComponent = (tag: string) => {
    const MotionComponent = (props: Record<string, unknown>) => {
      const { children, ...rest } = props;

      return React.createElement(tag, stripMotionProps(rest), children as React.ReactNode);
    };

    MotionComponent.displayName = `Motion${tag}`;

    return MotionComponent;
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      span: createMotionComponent('span'),
      p: createMotionComponent('p'),
      a: createMotionComponent('a'),
      button: createMotionComponent('button'),
      section: createMotionComponent('section'),
      article: createMotionComponent('article'),
      header: createMotionComponent('header'),
      footer: createMotionComponent('footer'),
      main: createMotionComponent('main'),
      nav: createMotionComponent('nav'),
      ul: createMotionComponent('ul'),
      li: createMotionComponent('li'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
      h4: createMotionComponent('h4'),
      h5: createMotionComponent('h5'),
      h6: createMotionComponent('h6'),
      img: createMotionComponent('img'),
      svg: createMotionComponent('svg'),
      path: createMotionComponent('path'),
    },

    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),

    useReducedMotion: () => false,

    useMotionValue: (initial: number | string = 0) => ({
      get: () => initial,
      set: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
    }),

    useSpring: (value: unknown) => value,

    useTransform: (value: unknown) => value,
  };
});
