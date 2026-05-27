'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutActions {
  onOpenHelp?: () => void;
  onCloseModal?: () => void;
  onFocusSearch?: () => void;
  onOpenCommandPalette?: () => void;
}

export const useKeyboardShortcuts = (actions: ShortcutActions) => {
  const router = useRouter();

  // Use refs instead of state to avoid re-triggering the useEffect or stale closures
  const pendingSequenceRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const actionsRef = useRef(actions);

  // Keep actions fresh without adding them to the main useEffect dependencies
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // ACCESSIBILITY: Prevent shortcuts while typing
      const isInputActive =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // 1. Handle Escape (Always allowed)
      if (event.key === 'Escape') {
        if (actionsRef.current.onCloseModal) actionsRef.current.onCloseModal();
        if (isInputActive) target.blur();
        pendingSequenceRef.current = null;
        return;
      }

      // Abort all other shortcuts if typing
      if (isInputActive) return;

      // 2. Handle Command Palette (Ctrl + K or Cmd + K)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (actionsRef.current.onOpenCommandPalette) actionsRef.current.onOpenCommandPalette();
        pendingSequenceRef.current = null;
        return;
      }

      // 3. Handle Help Modal (?)
      if (event.key === '?') {
        if (actionsRef.current.onOpenHelp) actionsRef.current.onOpenHelp();
        pendingSequenceRef.current = null;
        return;
      }

      // 4. Handle Search Focus (/)
      if (event.key === '/') {
        event.preventDefault();
        if (actionsRef.current.onFocusSearch) actionsRef.current.onFocusSearch();
        pendingSequenceRef.current = null;
        return;
      }

      // 5. Handle Navigation Sequences (g + h/d/r/p)
      if (pendingSequenceRef.current === 'g') {
        switch (event.key.toLowerCase()) {
          case 'h':
            router.push('/');
            break;
          case 'd':
            router.push('/dashboard');
            break;
          case 'r':
            router.push('/repositories');
            break;
          case 'p':
            router.push('/profile');
            break;
        }
        pendingSequenceRef.current = null;
        return;
      }

      // Start sequence if 'g' is pressed
      if (event.key.toLowerCase() === 'g') {
        pendingSequenceRef.current = 'g';

        // Use standard browser timeout to fix NodeJS type errors
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);

        timeoutRef.current = window.setTimeout(() => {
          pendingSequenceRef.current = null;
        }, 1500);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, [router]);
};
