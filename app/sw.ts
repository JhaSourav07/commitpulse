import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

// Extend the ServiceWorkerGlobalScope with Serwist's injected manifest
declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  // Serwist injects the build-time precache manifest here
  precacheEntries: self.__SW_MANIFEST,

  // Activate immediately — no waiting for existing tabs to close
  skipWaiting: true,
  clientsClaim: true,

  // Prefetch responses while the browser handles navigation
  navigationPreload: true,

  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
