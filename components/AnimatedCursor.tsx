'use client';

import { useEffect, useRef, useState } from 'react';

export type CursorStyle = 'normal' | 'star' | 'bright';

const CURSOR_STYLE_STORAGE_KEY = 'cursorStyle';
const CURSOR_STYLE_EVENT = 'cursorstylechange';

const STAR_CLIP_PATH =
  'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';

const isValidCursorStyle = (value: string | null): value is CursorStyle =>
  value === 'normal' || value === 'star' || value === 'bright';

export default function AnimatedCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [cursorStyle, setCursorStyle] = useState<CursorStyle>(() => {
    if (typeof window === 'undefined') return 'normal';
    const stored = window.localStorage.getItem(CURSOR_STYLE_STORAGE_KEY);
    return isValidCursorStyle(stored) ? stored : 'normal';
  });

  const isTestEnvironment = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

  const prefersReduced =
    !isTestEnvironment &&
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isHoveringRef = useRef(false);

  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  const setHover = (hovering: boolean) => {
    setIsHovering(hovering);
    isHoveringRef.current = hovering;
  };

  // Load the persisted cursor style once on mount, and stay in sync with
  // CursorStyleSwitcher via a custom event — matches the existing
  // localStorage + native-event pattern already used for the site's
  // dark/light theme, rather than introducing React context.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onStyleChange = (e: Event) => {
      const detail = (e as CustomEvent<CursorStyle>).detail;
      if (isValidCursorStyle(detail)) {
        setCursorStyle(detail);
      }
    };

    window.addEventListener(CURSOR_STYLE_EVENT, onStyleChange);
    return () => window.removeEventListener(CURSOR_STYLE_EVENT, onStyleChange);
  }, []);

  useEffect(() => {
    // Single guard — bail out on touch/mobile devices
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.body.style.cursor = 'none';

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
      }
    };

    const animate = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        const size = isHoveringRef.current ? 40 : 24;
        ringRef.current.style.transform = `translate(${ring.current.x - size / 2}px, ${ring.current.y - size / 2}px)`;
        ringRef.current.style.width = `${size}px`;
        ringRef.current.style.height = `${size}px`;
      }
      rafId.current = requestAnimationFrame(animate);
    };

    const onEnter = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('a, button, [role="button"], .card, input, textarea')) {
        setHover(true);
      }
    };

    const onLeave = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('a, button, [role="button"], .card, input, textarea')) {
        setHover(false);
      }
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onEnter);
    document.addEventListener('mouseout', onLeave);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onEnter);
      document.removeEventListener('mouseout', onLeave);
      cancelAnimationFrame(rafId.current);
      document.body.style.cursor = '';
    };
  }, []);

  if (prefersReduced) return null;

  const isBright = cursorStyle === 'bright';
  const isStar = cursorStyle === 'star';

  return (
    <>
      {/* Sharp dot — shape/intensity varies by cursorStyle, position logic is unchanged */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          background: isBright ? '#7ee7ff' : '#58a6ff',
          borderRadius: isStar ? 0 : '50%',
          clipPath: isStar ? STAR_CLIP_PATH : undefined,
          boxShadow: isBright
            ? '0 0 6px 2px rgba(126, 231, 255, 1), 0 0 18px 6px rgba(88, 166, 255, 0.85), 0 0 32px 12px rgba(88, 166, 255, 0.45)'
            : undefined,
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'opacity 0.2s',
        }}
      />
      {/* Lagging ring — shape/intensity varies by cursorStyle, position logic is unchanged */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          border: isStar
            ? 'none'
            : `1.5px solid ${isHovering ? '#58a6ff' : 'rgba(88,166,255,0.5)'}`,
          background: isStar
            ? isHovering
              ? '#58a6ff'
              : 'rgba(88,166,255,0.5)'
            : isHovering
              ? 'rgba(88,166,255,0.08)'
              : 'transparent',
          borderRadius: isStar ? 0 : '50%',
          clipPath: isStar ? STAR_CLIP_PATH : undefined,
          boxShadow: isBright
            ? `0 0 ${isHovering ? 16 : 10}px 3px rgba(126, 231, 255, 0.9), 0 0 ${isHovering ? 36 : 26}px 8px rgba(88, 166, 255, 0.5)`
            : undefined,
          pointerEvents: 'none',
          zIndex: 9998,
          transition: 'width 0.2s, height 0.2s, border-color 0.2s, background 0.2s',
        }}
      />
    </>
  );
}
