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

if (typeof globalThis.fetch !== 'undefined') {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = function (url: URL | RequestInfo, init?: RequestInit) {
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
}
