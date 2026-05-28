'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface InteractiveViewerProps {
  children: ReactNode;
  className?: string;
}

export default function InteractiveViewer({ children, className = '' }: InteractiveViewerProps) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;

      const PAN_STEP = 30;
      const ZOOM_STEP = 0.1;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setPan((p) => ({ ...p, y: p.y + PAN_STEP }));
          break;
        case 's':
        case 'arrowdown':
          setPan((p) => ({ ...p, y: p.y - PAN_STEP }));
          break;
        case 'a':
        case 'arrowleft':
          setPan((p) => ({ ...p, x: p.x + PAN_STEP }));
          break;
        case 'd':
        case 'arrowright':
          setPan((p) => ({ ...p, x: p.x - PAN_STEP }));
          break;
        case '+':
        case '=':
          setZoom((z) => Math.min(z + ZOOM_STEP, 3));
          break;
        case '-':
        case '_':
          setZoom((z) => Math.max(z - ZOOM_STEP, 0.5));
          break;
        case 'r':
          setPan({ x: 0, y: 0 });
          setZoom(1);
          break;
        default:
          return; // Let normal key presses pass through
      }
      
      // Prevent default scrolling for mapped keys
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((z) => Math.min(z + 0.1, 3));
      } else {
        setZoom((z) => Math.max(z - 0.1, 0.5));
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden touch-none cursor-grab active:cursor-grabbing select-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDragging.current ? 'none' : 'transform 0.1s ease-out',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}
