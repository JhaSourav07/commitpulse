'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import LoadingScreen from './LoadingScreen';

interface DashboardPageWrapperProps {
  children: React.ReactNode;
}

/**
 * Wraps dashboard page content and guarantees LoadingScreen plays its full
 * 3500ms animation regardless of how fast Next.js receives API data.
 *
 * The overlay is rendered via a React Portal directly into document.body —
 * this means it escapes ALL stacking contexts (navbar, layout wrappers, etc.)
 * and is unconditionally on top of everything on the page.
 */
export default function DashboardPageWrapper({ children }: DashboardPageWrapperProps) {
  const [ready, setReady] = useState(false);

  // Lazy initializer — typeof check makes this SSR-safe. Returns true only on
  // the client where document exists, avoiding the set-state-in-effect lint rule.
  const [mounted] = useState<boolean>(() => typeof document !== 'undefined');

  return (
    <>
      {/* Real page — renders immediately but stays invisible until animation ends */}
      <div
        style={{
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: ready ? 'auto' : 'none',
        }}
      >
        {children}
      </div>

      {/* Overlay portalled into document.body — escapes every stacking context */}
      {mounted &&
        !ready &&
        createPortal(<LoadingScreen onComplete={() => setReady(true)} />, document.body)}
    </>
  );
}
