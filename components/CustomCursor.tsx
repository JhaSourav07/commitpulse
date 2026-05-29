'use client';

import React, { useEffect, useState, useRef } from 'react';

const CustomCursor = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isHidden, setIsHidden] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Directly targeting DOM references
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkDevice = () => {
      const mobileCheck =
        window.matchMedia('(max-width: 768px)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0;
      setIsMobile(mobileCheck);
    };

    checkDevice();
    if (isMobile) return;

    const moveCursor = (e: MouseEvent) => {
      if (isHidden) setIsHidden(false);

      const x = e.clientX;
      const y = e.clientY;

      // Base sizes to calculate mathematical center offsets dynamically
      const dotSize = 12; // 12px -> w-3/h-3
      const ringSize = isHovered ? 58 : 32;
      const glowSize = isHovered ? 190 : 140;

      // Updating positions with absolute viewport centering logic (X - Size/2)
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${x - dotSize / 2}px, ${y - dotSize / 2}px) scale(${isHovered ? 1.3 : 1})`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${x - ringSize / 2}px, ${y - ringSize / 2}px)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${x - glowSize / 2}px, ${y - glowSize / 2}px)`;
      }
    };

    const handleMouseLeave = () => setIsHidden(true);
    const handleMouseEnter = () => setIsHidden(false);

    const addHoverEvents = () => {
      const interactiveElements = document.querySelectorAll(
        "a, button, [role='button'], input, select, textarea, .interactive-card"
      );
      interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', () => setIsHovered(true));
        el.addEventListener('mouseleave', () => setIsHovered(false));
      });
    };

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    addHoverEvents();

    const observer = new MutationObserver(addHoverEvents);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      observer.disconnect();
    };
  }, [isHidden, isMobile, isHovered]);

  if (isMobile || isHidden) return null;

  return (
    <>
      {/* 1. Cinematic Glow Layer */}
      <div
        ref={glowRef}
        className="fixed top-0 left-0 pointer-events-none z-[9997] mix-blend-screen transition-[width,height] duration-300 ease-out"
        style={{
          width: isHovered ? '190px' : '140px',
          height: isHovered ? '190px' : '140px',
          background:
            'radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(52,211,153,0.15) 25%, rgba(52,211,153,0.03) 55%, rgba(0,0,0,0) 75%)',
          filter: 'blur(4px)',
        }}
      />

      {/* 2. Outer Track Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998] border border-emerald-400/50 transition-[width,height,background-color,box-shadow] duration-200 ease-out"
        style={{
          width: isHovered ? '58px' : '32px',
          height: isHovered ? '58px' : '32px',
          backgroundColor: isHovered ? 'rgba(52, 211, 153, 0.08)' : 'transparent',
          boxShadow: isHovered
            ? '0 0 25px rgba(52, 211, 153, 0.45), inset 0 0 10px rgba(52, 211, 153, 0.15)'
            : 'none',
        }}
      />

      {/* 3. Center Core Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-3 h-3 bg-emerald-400 rounded-full pointer-events-none z-[9999] transition-transform duration-150 ease-out"
      />
    </>
  );
};

export default CustomCursor;
