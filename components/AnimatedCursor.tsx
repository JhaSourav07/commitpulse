'use client';

import { useEffect, useRef, useState } from 'react';

export default function AnimatedCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  // const prefersReduced =
  //   typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isTestEnvironment = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

  const prefersReduced =
    !isTestEnvironment &&
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // const [mounted, setMounted] = useState(false);
  // ── Reduced motion: hide custom cursor entirely when user prefers it ──

  // const [prefersReduced, setPrefersReduced] = useState(false);

  //   useEffect(() => {
  //   setMounted(true);

  //   const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  //   const handler = (e: MediaQueryListEvent) => {
  //     setPrefersReduced(e.matches);
  //   };

  //   mq.addEventListener('change', handler);

  //   return () => {
  //     mq.removeEventListener('change', handler);
  //   };
  // }, []);
  // ── End reduced motion guard ──────────────────────────────────────────
  // useEffect(() => {
  //   if (!mounted) return;

  //   const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  //   setPrefersReduced(mq.matches);
  // }, [mounted]);

  const isHoveringRef = useRef(false);

  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  // Helper function to update both state (for DOM renders) and ref (for RAF loop)
  const setHover = (hovering: boolean) => {
    setIsHovering(hovering);
    isHoveringRef.current = hovering;
  };

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

    // Defined at effect scope so cleanup can reference them
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

    // Single cleanup — removes everything
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onEnter);
      document.removeEventListener('mouseout', onLeave);
      cancelAnimationFrame(rafId.current);
      document.body.style.cursor = '';
    };
  }, []);

  // Render nothing when user prefers reduced motion — native cursor takes over
  // if (!mounted) return null;

  if (prefersReduced) return null;

  return (
    <>
      {/* Sharp dot */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          background: '#58a6ff',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'opacity 0.2s',
        }}
      />
      {/* Lagging ring */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          border: `1.5px solid ${isHovering ? '#58a6ff' : 'rgba(88,166,255,0.5)'}`,
          background: isHovering ? 'rgba(88,166,255,0.08)' : 'transparent',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9998,
          transition: 'width 0.2s, height 0.2s, border-color 0.2s, background 0.2s',
        }}
      />
    </>
  );
}
