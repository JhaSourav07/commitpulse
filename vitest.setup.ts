import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { vi } from 'vitest';

// Mock IntersectionObserver globally for Framer Motion tests
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
}

// 1. Next-Auth ko crash hone se bachane ke liye env variables defaults set karo
process.env.AUTH_SECRET = 'a-super-secret-32-character-dummy-string-for-tests';
process.env.NEXTAUTH_SECRET = 'a-super-secret-32-character-dummy-string-for-tests';
// Ensure global fallback matches length and prefix requirements in github.ts
process.env.GITHUB_TOKEN = 'ghp_mocktokenfortesting123456789012345';
process.env.GITHUB_PAT = 'ghp_mockpatfortesting12345678901234567';

// Next.js ke dynamic headers context ko mock karo taaki tests crash na hon
vi.mock('next/headers', () => {
  const mockHeaders = new Headers({
    host: 'localhost:3000',
    'user-agent': 'vitest-test-agent',
  });

  return {
    headers: vi.fn(() => Promise.resolve(mockHeaders)),
    cookies: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    })),
  };
});

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
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  window.XMLSerializer =
    window.XMLSerializer ||
    class {
      serializeToString() {
        return '';
      }
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

  // Mock IntersectionObserver for Framer Motion / JSDOM compatibility
  class MockIntersectionObserver {
    disconnect = vi.fn();
    observe = vi.fn();
    takeRecords = vi.fn(() => []);
    unobserve = vi.fn();
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
}

if (typeof globalThis.fetch !== 'undefined') {
  const originalFetch = globalThis.fetch;
  const guardedFetch = function (url: URL | RequestInfo, init?: RequestInit) {
    const urlString =
      typeof url === 'string'
        ? url
        : url instanceof URL
          ? url.toString()
          : url && typeof url === 'object' && 'url' in url
            ? (url as Request).url
            : '';

    // Allow localhost/127.0.0.1 and data: URLs (inline resources/WebAssembly)
    const normalizedUrl = urlString.trim().toLowerCase();
    if (
      normalizedUrl.includes('localhost') ||
      normalizedUrl.includes('127.0.0.1') ||
      normalizedUrl.startsWith('data:')
    ) {
      return originalFetch(url, init);
    }

    throw new Error(
      `[Vitest Guard] Blocked outbound network request to: ${urlString}. ` +
        `Do not make real network requests in unit tests. Please mock global.fetch or use MSW.`
    );
  } as typeof fetch;

  globalThis.fetch = guardedFetch;

  // Restore the guarded fetch after each test to prevent global fetch mock leaks
  afterEach(() => {
    globalThis.fetch = guardedFetch;
  });
}

import enTranslations from './locales/en.json';

// Global Translation Context Mock
vi.mock('@/context/TranslationContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/TranslationContext')>();

  const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    return path.split('.').reduce((acc: unknown, part) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  };

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: Record<string, string | number> & { defaultValue?: string }) => {
        let val = getNestedValue(enTranslations as Record<string, unknown>, key) as string;

        if (!val) {
          if (options && typeof options.defaultValue === 'string') {
            val = options.defaultValue;
          } else {
            const parts = key.split('.');
            val = parts[parts.length - 1];
          }
        }

        if (options && typeof val === 'string') {
          Object.keys(options).forEach((k) => {
            if (k !== 'defaultValue') {
              val = val.replace(`{{${k}}}`, String(options[k]));
            }
          });
        }
        return val;
      },
    }),
  };
});
