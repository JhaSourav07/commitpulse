'use client';

import { useState } from 'react';
import type { CursorStyle } from './AnimatedCursor';

const CURSOR_STYLE_STORAGE_KEY = 'cursorStyle';
const CURSOR_STYLE_EVENT = 'cursorstylechange';

const CURSOR_STYLE_OPTIONS: { value: CursorStyle; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'star', label: 'Star' },
  { value: 'bright', label: 'Bright' },
];

const isValidCursorStyle = (value: string | null): value is CursorStyle =>
  value === 'normal' || value === 'star' || value === 'bright';

export default function CursorStyleSwitcher() {
  const [active, setActive] = useState<CursorStyle>(() => {
    if (typeof window === 'undefined') return 'normal';
    const stored = window.localStorage.getItem(CURSOR_STYLE_STORAGE_KEY);
    return isValidCursorStyle(stored) ? stored : 'normal';
  });

  const selectStyle = (value: CursorStyle) => {
    setActive(value);
    window.localStorage.setItem(CURSOR_STYLE_STORAGE_KEY, value);
    window.dispatchEvent(new CustomEvent(CURSOR_STYLE_EVENT, { detail: value }));
  };

  return (
    <div
      role="group"
      aria-label="Cursor style"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 10000,
        display: 'flex',
        gap: 4,
        padding: 4,
        borderRadius: 8,
        background: 'rgba(13, 17, 23, 0.85)',
        border: '1px solid rgba(88, 166, 255, 0.3)',
      }}
    >
      {CURSOR_STYLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={active === option.value}
          onClick={() => selectStyle(option.value)}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            color: active === option.value ? '#0d1117' : '#c9d1d9',
            background: active === option.value ? '#58a6ff' : 'transparent',
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
