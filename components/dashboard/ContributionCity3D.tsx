'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ActivityData } from '@/types/dashboard';

// ─── Theme palette (mirrors lib/svg/themes.ts accent colours) ────────────────
const THEME_PALETTES: Record<string, { accent: string; bg: string; top: string; side: string }> = {
  dark: { accent: '#58a6ff', bg: '#0d1117', top: '#58a6ff', side: '#1a3a5c' },
  neon: { accent: '#ff00ff', bg: '#000000', top: '#ff00ff', side: '#660066' },
  dracula: { accent: '#bd93f9', bg: '#282a36', top: '#bd93f9', side: '#44475a' },
  synthwave: { accent: '#ff2d78', bg: '#0d0221', top: '#ff2d78', side: '#4d0024' },
  ocean: { accent: '#64ffda', bg: '#0a192f', top: '#64ffda', side: '#0a3d2b' },
  forest: { accent: '#39d353', bg: '#0d1f0d', top: '#39d353', side: '#1a3d1a' },
  github: { accent: '#238636', bg: '#0d1117', top: '#238636', side: '#0d2818' },
  rose: { accent: '#ff6b9d', bg: '#1f0d14', top: '#ff6b9d', side: '#4d1f2e' },
  nord: { accent: '#88c0d0', bg: '#2e3440', top: '#88c0d0', side: '#3b5060' },
  sunset: { accent: '#ff6b35', bg: '#1a0a0a', top: '#ff6b35', side: '#4d2010' },
};

const DEFAULT_PALETTE = THEME_PALETTES.dark;

// ─── Lightweight 3D renderer (no external dep, raw WebGL via canvas) ─────────
// We implement a simple isometric-style 3D city using Canvas2D with
// painter's-algorithm depth sorting. This avoids adding Three.js / R3F to
// the bundle and keeps the component self-contained.

interface CubeSpec {
  col: number; // grid x
  row: number; // grid z
  height: number; // normalised 0–1
  count: number; // raw contribution count (for tooltip)
  date: string;
  intensity: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.max(0, r - amount)},${Math.max(0, g - amount)},${Math.max(0, b - amount)})`;
}

export interface ContributionCity3DProps {
  data: ActivityData[];
  theme?: string;
  /** Show the last N days of data (default: 98 = 14 weeks) */
  days?: number;
}

interface TooltipState {
  x: number;
  y: number;
  date: string;
  count: number;
}

export default function ContributionCity3D({
  data,
  theme = 'dark',
  days = 98,
}: ContributionCity3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hoverDataRef = useRef<
    Array<{
      x: number;
      y: number;
      count: number;
      date: string;
      radius: number;
    }>
  >([]);

  // Camera state – angles in radians
  const [isDragging, setIsDragging] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const cameraRef = useRef({
    rotY: 0.45, // orbit angle (0 = looking from +Z)
    tiltX: 0.52, // vertical tilt (radians; ~30°)
    zoom: 1,
    dragStartX: 0,
    dragStartY: 0,
    startRotY: 0,
    startTiltX: 0,
  });

  const palette = THEME_PALETTES[theme] ?? DEFAULT_PALETTE;

  // ── Build cube specs from ActivityData ─────────────────────────────────────
  const cubes = useCallback((): CubeSpec[] => {
    const recent = data.slice(-days);
    const max = Math.max(...recent.map((d) => d.count), 1);

    return recent.map((d, i) => ({
      col: Math.floor(i / 7), // week column
      row: i % 7, // day-of-week row
      height: d.count === 0 ? 0.04 : 0.1 + 0.9 * (d.count / max),
      count: d.count,
      date: d.date,
      intensity: d.intensity,
    }));
  }, [data, days]);

  // ── Draw ───────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, W, H);

    const cam = cameraRef.current;
    const zoom = cam.zoom;

    // Tile dimensions – responsive
    const baseW = Math.min(W, H) * 0.065 * zoom;
    const tileW = baseW;
    const tileH = baseW * 0.5;
    const maxCubeHeight = Math.min(W, H) * 0.35 * zoom;

    // Isometric rotation: we rotate around Y then X using simple 2D trigonometry
    // For a proper orbit we re-project each cube through the camera matrix.
    const cosY = Math.cos(cam.rotY);
    const sinY = Math.sin(cam.rotY);
    const cosX = Math.cos(cam.tiltX);
    const sinX = Math.sin(cam.tiltX);

    const specs = cubes();
    const COLS = 14;
    const ROWS = 7;

    // Centre-offset so the grid is centred on canvas
    const gridH = (COLS + ROWS) * (tileH / 2);
    const offsetX = W / 2;
    const offsetY = H / 2;

    // Project a 3D point (world x, world y (up), world z) → canvas (cx, cy)
    function project(wx: number, wy: number, wz: number): { cx: number; cy: number } {
      // Rotate around Y axis
      const rx = wx * cosY - wz * sinY;
      const rz = wx * sinY + wz * cosY;
      // Rotate around X axis (tilt)
      const ry2 = wy * cosX - rz * sinX;
      const rz2 = wy * sinX + rz * cosX;
      // Orthographic projection
      return {
        cx: offsetX + rx * tileW,
        cy: offsetY - ry2 * tileH - rz2 * (tileH * 0.1) + gridH * 0.25,
      };
    }

    // Sort cubes back-to-front (painter's algorithm)
    const sorted = [...specs].sort((a, b) => {
      // depth ≈ distance into the screen after camera rotation
      const da = a.col * sinY + a.row * cosY;
      const db = b.col * sinY + b.row * cosY;
      return da - db;
    });
    hoverDataRef.current = [];

    for (const cube of sorted) {
      const { col, row, height } = cube;
      const cubeH = height * maxCubeHeight;

      // World coords: col → x, row → z, height → y
      const wx = col - COLS / 2;
      const wz = row - ROWS / 2;

      // 8 corners of the cube (bottom 4, top 4)
      const b0 = project(wx, 0, wz);
      const b1 = project(wx + 1, 0, wz);
      const b2 = project(wx + 1, 0, wz + 1);
      const b3 = project(wx, 0, wz + 1);

      const cubeHWorld = cubeH / tileH;
      const t0 = project(wx, cubeHWorld, wz);
      const t1 = project(wx + 1, cubeHWorld, wz);
      const t2 = project(wx + 1, cubeHWorld, wz + 1);
      const t3 = project(wx, cubeHWorld, wz + 1);
      const centerX = (t0.cx + t1.cx + t2.cx + t3.cx) / 4;
      const centerY = (t0.cy + t1.cy + t2.cy + t3.cy) / 4;

      hoverDataRef.current.push({
        x: centerX,
        y: centerY,
        count: cube.count,
        date: cube.date,
        radius: tileW * 0.45,
      });

      // Intensity-based tint
      const intFactor = cube.intensity / 4;
      const topColor =
        cube.count === 0 ? darken(palette.bg, -20) : lighten(palette.top, intFactor * 80);
      const leftColor =
        cube.count === 0 ? darken(palette.bg, -10) : darken(palette.side, -intFactor * 30);
      const rightColor =
        cube.count === 0 ? darken(palette.bg, -5) : darken(palette.side, intFactor * 20);

      const drawFace = (
        p0: { cx: number; cy: number },
        p1: { cx: number; cy: number },
        p2: { cx: number; cy: number },
        p3: { cx: number; cy: number },
        color: string
      ) => {
        ctx.beginPath();
        ctx.moveTo(p0.cx, p0.cy);
        ctx.lineTo(p1.cx, p1.cy);
        ctx.lineTo(p2.cx, p2.cy);
        ctx.lineTo(p3.cx, p3.cy);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = palette.bg;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      };

      // Left face (col side)
      drawFace(b0, b3, t3, t0, leftColor);
      // Right face (row side)
      drawFace(b1, b2, t2, t1, rightColor);
      // Top face
      drawFace(t0, t1, t2, t3, topColor);

      // Glow ring on top for high-intensity cubes
      if (cube.intensity >= 3 && cube.count > 0) {
        const glowRadius = tileW * 0.35;
        const cx2 = (t0.cx + t1.cx + t2.cx + t3.cx) / 4;
        const cy2 = (t0.cy + t1.cy + t2.cy + t3.cy) / 4;
        const grd = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, glowRadius);
        grd.addColorStop(0, `${palette.accent}88`);
        grd.addColorStop(1, `${palette.accent}00`);
        ctx.beginPath();
        ctx.ellipse(cx2, cy2, glowRadius, glowRadius * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }
    }

    // Subtle grid floor
    ctx.globalAlpha = 0.08;
    for (let c = 0; c <= COLS; c++) {
      const a = project(c - COLS / 2, 0, -ROWS / 2);
      const b = project(c - COLS / 2, 0, ROWS / 2);
      ctx.beginPath();
      ctx.moveTo(a.cx, a.cy);
      ctx.lineTo(b.cx, b.cy);
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      const a = project(-COLS / 2, 0, r - ROWS / 2);
      const b = project(COLS / 2, 0, r - ROWS / 2);
      ctx.beginPath();
      ctx.moveTo(a.cx, a.cy);
      ctx.lineTo(b.cx, b.cy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [cubes, palette]);

  // ── Resize observer ────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    });
    ro.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    draw();
    return () => ro.disconnect();
  }, [draw]);

  // ── Redraw on data/theme change ────────────────────────────────────────────
  useEffect(() => {
    draw();
  }, [draw]);

  // ── Pointer events – orbit drag ────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    const cam = cameraRef.current;
    cam.dragStartX = e.clientX;
    cam.dragStartY = e.clientY;
    cam.startRotY = cam.rotY;
    cam.startTiltX = cam.tiltX;
    setTooltip(null);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      const cam = cameraRef.current;
      const dx = e.clientX - cam.dragStartX;
      const dy = e.clientY - cam.dragStartY;

      cam.rotY = cam.startRotY + dx * 0.008;
      cam.tiltX = Math.max(0.1, Math.min(1.2, cam.startTiltX + dy * 0.005));

      draw();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hit = hoverDataRef.current.find((tower) => {
      const dx = mouseX - tower.x;
      const dy = mouseY - tower.y;

      return Math.sqrt(dx * dx + dy * dy) <= tower.radius;
    });

    if (hit) {
      const padding = 80;

      const safeX = Math.max(padding, Math.min(hit.x, rect.width - padding));

      const safeY = Math.max(40, hit.y);

      setTooltip({
        x: safeX,
        y: safeY,
        count: hit.count,
        date: hit.date,
      });
    } else {
      setTooltip(null);
    }
  };

  const onPointerUp = () => setIsDragging(false);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const cam = cameraRef.current;
    cam.zoom = Math.max(0.4, Math.min(2.5, cam.zoom - e.deltaY * 0.001));
    draw();
  };

  // ── Touch pinch-to-zoom ────────────────────────────────────────────────────
  const lastPinchRef = useRef<number | null>(null);
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchRef.current !== null) {
        const delta = dist - lastPinchRef.current;
        const cam = cameraRef.current;
        cam.zoom = Math.max(0.4, Math.min(2.5, cam.zoom + delta * 0.003));
        draw();
      }
      lastPinchRef.current = dist;
    }
  };
  const onTouchEnd = () => {
    lastPinchRef.current = null;
  };

  return (
    <div className="relative w-full" style={{ background: palette.bg, borderRadius: 12 }}>
      {/* Canvas container */}
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: 360, cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setTooltip(null)}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ display: 'block' }}
        />
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 px-3 py-2 text-xs rounded-lg shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            background: '#111',
            color: palette.accent,
            border: `1px solid ${palette.accent}44`,
            transform: 'translate(-50%, -120%)',
            whiteSpace: 'nowrap',
          }}
        >
          <span className="font-semibold">
            {tooltip.count} contribution{tooltip.count !== 1 ? 's' : ''}
          </span>
          <br />
          <span className="opacity-60">{tooltip.date}</span>
        </div>
      )}

      {/* Controls hint */}
      <div
        className="absolute bottom-3 right-4 text-xs opacity-40 select-none pointer-events-none"
        style={{ color: palette.accent }}
      >
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
