'use client';

import { useShortcutContext } from '@/context/ShortcutContext';
import { useEffect, useRef } from 'react';

export const KeyboardHelpModal = () => {
  const { isHelpOpen, closeHelp } = useShortcutContext();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ACCESSIBILITY: Manage focus when the modal opens
  useEffect(() => {
    if (isHelpOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isHelpOpen]);

  if (!isHelpOpen) return null;

  const shortcuts = [
    { keys: ['?'], description: 'Open shortcuts help' },
    { keys: ['Esc'], description: 'Close active modal or dialog' },
    { keys: ['/'], description: 'Focus search input' },
    { keys: ['Ctrl', 'K'], description: 'Open command palette' },
    { keys: ['g', 'h'], description: 'Navigate to Home' },
    { keys: ['g', 'd'], description: 'Navigate to Dashboard' },
    { keys: ['g', 'r'], description: 'Navigate to Repositories' },
    { keys: ['g', 'p'], description: 'Navigate to Profile' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="help-modal-title" className="text-xl font-semibold text-white">
            Keyboard Shortcuts
          </h2>
          <button
            ref={closeButtonRef}
            onClick={closeHelp}
            className="text-zinc-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 rounded-md p-1"
            aria-label="Close help modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <ul className="space-y-4">
          {shortcuts.map((shortcut, idx) => (
            <li key={idx} className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIdx) => (
                  <kbd
                    key={keyIdx}
                    className="px-2 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-md"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
