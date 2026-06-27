'use client';

import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const [disabled, setDisabled] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const circlePos = useRef({ x: 0, y: 0 });
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const stored = localStorage.getItem('disableCustomCursor');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisabled(stored === 'true');

    const handleStorage = () => {
      const val = localStorage.getItem('disableCustomCursor');

      setDisabled(val === 'true');
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('cursorToggle', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cursorToggle', handleStorage);
    };
  }, []);

  useEffect(() => {
    document.body.style.cursor = disabled ? 'auto' : 'none';
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };

    let animFrame: number;
    const animate = () => {
      circlePos.current.x += (mousePos.current.x - circlePos.current.x) * 0.12;
      circlePos.current.y += (mousePos.current.y - circlePos.current.y) * 0.12;
      if (circleRef.current) {
        circleRef.current.style.transform = `translate(${circlePos.current.x}px, ${circlePos.current.y}px)`;
      }
      animFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove);
    animFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animFrame);
    };
  }, [disabled]);

  if (disabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ willChange: 'transform' }}
      >
        <div className="w-2 h-2 rounded-full bg-blue-500 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div
        ref={circleRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ willChange: 'transform' }}
      >
        <div className="w-8 h-8 rounded-full border border-blue-400 -translate-x-1/2 -translate-y-1/2 opacity-70" />
      </div>
    </>
  );
}
