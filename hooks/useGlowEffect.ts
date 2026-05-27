'use client';

import { CSSProperties, useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';

export function useGlowEffect() {
  const shellRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const animationRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 50, y: 50 });
  const currentRef = useRef({ x: 50, y: 50 });
  const activeRef = useRef(false);

  const shellVars = {
    ['--mx' as string]: '50%',
    ['--my' as string]: '50%',
    ['--glow-opacity' as string]: '0',
    ['--border-opacity' as string]: '0',
  } as CSSProperties & Record<string, string>;

  const updateRect = () => {
    const shell = shellRef.current;
    rectRef.current = shell ? shell.getBoundingClientRect() : null;
  };

  const animateGlow = () => {
    const shell = shellRef.current;

    if (!shell) {
      animationRef.current = null;
      return;
    }

    const smoothing = 0.16;
    currentRef.current.x += (targetRef.current.x - currentRef.current.x) * smoothing;
    currentRef.current.y += (targetRef.current.y - currentRef.current.y) * smoothing;

    shell.style.setProperty('--mx', `${currentRef.current.x}%`);
    shell.style.setProperty('--my', `${currentRef.current.y}%`);
    shell.style.setProperty('--glow-opacity', activeRef.current ? '1' : '0');
    shell.style.setProperty('--border-opacity', activeRef.current ? '1' : '0');

    const settled =
      Math.abs(targetRef.current.x - currentRef.current.x) < 0.08 &&
      Math.abs(targetRef.current.y - currentRef.current.y) < 0.08;

    if (!activeRef.current && settled) {
      animationRef.current = null;
      return;
    }

    animationRef.current = requestAnimationFrame(animateGlow);
  };

  const startAnimation = () => {
    if (animationRef.current !== null) return;
    animationRef.current = requestAnimationFrame(animateGlow);
  };

  useEffect(() => {
    updateRect();

    const handleViewportChange = () => {
      updateRect();
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    let resizeObserver: ResizeObserver | null = null;

    if (shellRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(handleViewportChange);
      resizeObserver.observe(shellRef.current);
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      resizeObserver?.disconnect();
    };
  }, []);

  const handleMouseEnter = () => updateRect();

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!rectRef.current) {
      rectRef.current = event.currentTarget.getBoundingClientRect();
    }

    const rect = rectRef.current;
    if (!rect) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    targetRef.current = { x, y };
    activeRef.current = true;
    startAnimation();
  };

  const handleMouseLeave = () => {
    activeRef.current = false;
    rectRef.current = null;
    startAnimation();
  };

  return { shellRef, shellVars, handleMouseEnter, handleMouseMove, handleMouseLeave };
}
