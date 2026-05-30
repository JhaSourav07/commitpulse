/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isHidden, setIsHidden] = useState(true);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const mobileCheck =
      window.matchMedia('(max-width: 768px)').matches ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;

    setIsMobile(mobileCheck);
    if (mobileCheck || prefersReducedMotion) return;

    const moveCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsHidden(false);
    };

    const handleMouseLeave = () => setIsHidden(true);
    const handleMouseEnter = () => setIsHidden(false);

    const handleElementEnter = () => setIsHovered(true);
    const handleElementLeave = () => setIsHovered(false);

    const addHoverEvents = () => {
      const interactiveElements = document.querySelectorAll(
        "a, button, [role='button'], .interactive-card"
      );
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleElementEnter);
        el.removeEventListener('mouseleave', handleElementLeave);
        el.addEventListener('mouseenter', handleElementEnter);
        el.addEventListener('mouseleave', handleElementLeave);
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
  }, []);

  if (isMobile || isHidden) return null;

  return (
    <>
      <div
        className={`fixed top-0 left-0 w-2 h-2 bg-emerald-400 rounded-full pointer-events-none z-[100000] transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ${
          isHovered ? 'scale-75 bg-cyan-400' : ''
        }`}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
      <div
        className={`fixed top-0 left-0 w-8 h-8 border border-emerald-400/50 rounded-full pointer-events-none z-[100000] transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
          isHovered ? 'scale-150 border-cyan-400 bg-cyan-400/10' : ''
        }`}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
    </>
  );
}
