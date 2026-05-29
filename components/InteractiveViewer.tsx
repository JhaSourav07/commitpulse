'use client';

import React, { useState, useRef, ReactNode, useMemo, type ReactElement } from 'react';

// ── Parallax particle configuration ──────────────────────────────────────────
// Particles are generated deterministically so SSR and client renders match,
// preventing React hydration mismatches.
const PARALLAX_PARTICLE_COUNT = 20;

interface ParallaxParticle {
  id: number;
  x: number; // base X position as percentage of container width
  y: number; // base Y position as percentage of container height
  size: number; // side length in px
  opacity: number; // resting opacity (intentionally subtle)
  depth: number; // parallax depth multiplier (0–1); deeper = more shift on mouse move
  color: string;
  isCircle: boolean; // mix of rounded and square contribution cells
}

/** Builds a stable set of contribution-square particles for the parallax layer.
 *  Deterministic math prevents random values from causing SSR/CSR mismatches. */
function buildParticles(): ParallaxParticle[] {
  const colors = ['#10b981', '#8b5cf6', '#06b6d4', '#3b82f6', '#f59e0b'];
  return Array.from(
    { length: PARALLAX_PARTICLE_COUNT },
    (_, i): ParallaxParticle => ({
      id: i,
      // Spread particles across the container using prime-number strides
      x: (i * 17 + 11) % 100,
      y: (i * 23 + 7) % 100,
      size: 4 + (i % 5) * 2, // range: 4–12 px
      // Keep opacity low so particles never obscure the badge
      opacity: 0.05 + (i % 4) * 0.025, // range: 0.05–0.125
      // Vary depth so each "layer" of particles shifts by a different amount,
      // creating the illusion of 3-D depth. depth 0.1 = farthest; 0.7 = nearest.
      depth: 0.1 + (i % 6) * 0.1, // range: 0.1–0.6
      color: colors[i % colors.length],
      isCircle: i % 4 === 0,
    })
  );
}

// How many pixels a depth-1.0 particle shifts when the cursor is at the
// container edge. Shallower particles shift proportionally less.
const PARALLAX_STRENGTH = 80;

interface InteractiveViewerProps {
  children: ReactNode;
  className?: string;
}

export default function InteractiveViewer({
  children,
  className = '',
}: InteractiveViewerProps): ReactElement {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Normalized cursor position within the container [0, 1].
  // Default to center (0.5) so the glow starts centered and fades in on first hover.
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovering, setIsHovering] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Stable particle list — generated once on mount, never re-shuffled.
  const particles = useMemo((): ParallaxParticle[] => buildParticles(), []);

  // ── Parallax math ──────────────────────────────────────────────────────────
  // Offset from center: at mousePos.x = 0.5, offset = 0 (no shift).
  // At the left edge (0), offset = -STRENGTH/2; at right (1), offset = +STRENGTH/2.
  const hoverParallaxX = (mousePos.x - 0.5) * PARALLAX_STRENGTH;
  const hoverParallaxY = (mousePos.y - 0.5) * PARALLAX_STRENGTH;

  // When the user pans the card (dragging/keyboard), the background should pan
  // along with it to create a sense of camera movement across a 3D scene.
  const parallaxX = hoverParallaxX + pan.x;
  const parallaxY = hoverParallaxY + pan.y;

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
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

  // ── Pointer events ─────────────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent): void => {
    isDragging.current = true;
    setIsDraggingState(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent): void => {
    // Always track cursor position for the parallax effect, even when not dragging
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
      });
    }

    // Only apply pan logic when actively dragging
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent): void => {
    isDragging.current = false;
    setIsDraggingState(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handlePointerEnter = (): void => setIsHovering(true);

  const handlePointerLeave = (): void => {
    setIsHovering(false);
    // Reset cursor position to center so the glow fades out gracefully from center
    setMousePos({ x: 0.5, y: 0.5 });
  };

  const handleWheel = (e: React.WheelEvent): void => {
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
      tabIndex={0}
      className={`relative overflow-hidden touch-none cursor-grab active:cursor-grabbing select-none focus:outline-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* ── Parallax background layer ──────────────────────────────────────────
           This layer renders behind the card content (DOM order + z-index).
           It reacts to the cursor without touching the badge SVG or its animations. */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
        data-testid="parallax-bg-layer"
      >
        {/* Cursor-following radial glow — softly illuminates the area under the cursor */}
        <div
          data-testid="parallax-cursor-glow"
          style={{
            position: 'absolute',
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(139,92,246,0.08) 45%, transparent 70%)',
            opacity: isHovering ? 1 : 0,
            // Position follows the cursor immediately; opacity fades in/out slowly
            transition: 'opacity 0.5s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Ambient lighting — a broad, soft gradient that shifts with the cursor quadrant,
             making the overall card background feel responsive to where the user looks */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(16,185,129,0.06) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)`,
            opacity: isHovering ? 1 : 0,
            transition: 'opacity 0.6s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Floating contribution squares at varying parallax depths.
             Each particle shifts by (parallaxX * depth, parallaxY * depth) px relative
             to its base position, so "closer" particles (higher depth) shift more —
             creating the impression of a multi-layered isometric space. */}
        {particles.map(
          (particle): ReactElement => (
            <div
              key={particle.id}
              style={{
                position: 'absolute',
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: particle.isCircle ? '50%' : '2px',
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}55`,
                opacity: isHovering ? particle.opacity * 1.8 : particle.opacity,
                // Particles shift in the SAME direction as the cursor offset to create
                // a realistic parallax: near objects (depth ~0.6) move more than far ones.
                transform: `translate(${parallaxX * particle.depth}px, ${parallaxY * particle.depth}px)`,
                // Smooth lerp toward the new position; opacity fades independently
                transition: `transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s ease`,
                pointerEvents: 'none',
                willChange: 'transform',
              }}
            />
          )
        )}
      </div>

      {/* ── Card content ──────────────────────────────────────────────────────
           Rendered above the parallax layer via DOM order; position:relative +
           zIndex ensures the badge always sits in front of the background. */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDraggingState ? 'none' : 'transform 0.1s ease-out',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}
