'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Download } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import type { ActivityData } from '@/types/dashboard';
import EmptyState from './EmptyState';

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
  timeLapseMode?: boolean;
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
  timeLapseMode = false,
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
  const [hasWebGLFailed, setHasWebGLFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setHasWebGLFailed(true);
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
    };
  }, []);

  // Time-Lapse state
  const [isPlaying, setIsPlaying] = useState(timeLapseMode);
  const [playbackIndex, setPlaybackIndex] = useState(timeLapseMode ? 7 : days);

  const [isExporting, setIsExporting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

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

  // ── Replay My Year state ───────────────────────────────────────────────────
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalDays = useMemo(() => data.slice(-days).length, [data, days]);

  const stopReplay = useCallback(() => {
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    setIsReplaying(false);
    setReplayIndex(null);
  }, []);

  const startReplay = useCallback(() => {
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    setIsReplaying(true);
    setReplayIndex(1);
  }, []);

  // Advance the replay frame-by-frame
  useEffect(() => {
    if (!isReplaying || replayIndex === null) return;
    if (replayIndex >= totalDays) {
      // Finished – hold full view for a moment then stop
      replayTimerRef.current = setTimeout(() => stopReplay(), 800);
      return;
    }
    // Speed: faster at the start, steady in the middle — ~12ms per day
    const delay = replayIndex < 10 ? 30 : 12;
    replayTimerRef.current = setTimeout(() => {
      setReplayIndex((prev) => (prev !== null ? prev + 1 : null));
    }, delay);
    return () => {
      if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    };
  }, [isReplaying, replayIndex, totalDays, stopReplay]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    },
    []
  );

  const handleExport = useCallback(() => {
    if (!window.MediaRecorder) {
      alert('Your browser does not support the MediaRecorder API needed for export.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Cast canvas to any to avoid TS errors if captureStream is missing in types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream = (canvas as any).captureStream(60);

      let mimeType = 'video/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            mimeType = 'video/webm;codecs=vp9';
          } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            mimeType = 'video/webm;codecs=vp8';
          } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
          } else {
            mimeType = '';
          }
        }
      }

      const recorderOptions = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, recorderOptions);

      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const finalMimeType = mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: finalMimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `contribution-timelapse.${ext}`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        setIsExporting(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsExporting(true);

      // Reset playback and start
      setPlaybackIndex(7);
      setIsPlaying(true);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to start export recording. Make sure your browser supports captureStream.');
      setIsExporting(false);
    }
  }, []);

  // Stop recording when playback reaches the end
  useEffect(() => {
    if (isExporting && !isPlaying && playbackIndex >= Math.min(days, data.length)) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
  }, [isPlaying, isExporting, playbackIndex, days, data.length]);

  // ── Build cube specs from ActivityData ─────────────────────────────────────
  const cubes = useCallback((): CubeSpec[] => {
    const recent = data.slice(-days);
    // When replaying, slice to current frame; zero out future cubes for clean build-up
    const max = Math.max(...recent.map((d) => d.count), 1);

    const visibleData = timeLapseMode ? recent.slice(0, playbackIndex) : recent;
    const visibleCount = replayIndex !== null ? replayIndex : visibleData.length;

    return visibleData.map((d, i) => ({
      col: Math.floor(i / 7),
      row: i % 7,
      height: i >= visibleCount ? 0.04 : d.count === 0 ? 0.04 : 0.1 + 0.9 * (d.count / max),
      count: i >= visibleCount ? 0 : d.count,
      date: d.date,
      intensity: i >= visibleCount ? 0 : d.intensity,
    }));
  }, [data, days, timeLapseMode, playbackIndex, replayIndex]);

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

  // ── Time-Lapse Animation Loop ──────────────────────────────────────────────
  useEffect(() => {
    if (!timeLapseMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlaybackIndex(days);

      setIsPlaying(false);
      return;
    }

    if (!isPlaying) return;

    const maxIndex = Math.min(days, data.length);
    let frame: number;
    let lastTime = performance.now();

    const tick = (time: number) => {
      if (time - lastTime > 60) {
        setPlaybackIndex((prev) => {
          if (prev >= maxIndex) {
            setIsPlaying(false);
            return maxIndex;
          }
          return Math.min(prev + 7, maxIndex);
        });
        lastTime = time;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [timeLapseMode, isPlaying, data.length, days]);

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

  if (hasWebGLFailed) {
    return (
      <div
        className="flex h-[360px] w-full items-center justify-center rounded-xl"
        style={{ background: palette.bg }}
      >
        <div className="text-sm font-medium opacity-60" style={{ color: palette.accent }}>
          Low Memory - 3D Disabled
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState message="No activity found for this timeframe" />;
  }

  return (
    <div className="relative w-full" style={{ background: palette.bg, borderRadius: 12 }}>
      {/* Canvas container */}
      <ErrorBoundary
        fallback={
          <div
            className="flex h-[360px] w-full items-center justify-center rounded-xl"
            style={{ background: palette.bg }}
          >
            <div className="text-sm font-medium opacity-60" style={{ color: palette.accent }}>
              Low Memory - 3D Disabled
            </div>
          </div>
        }
      >
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
      </ErrorBoundary>

      {/* Replay My Year button */}
      <div className="absolute top-3 left-4 flex items-center gap-2">
        <button
          onClick={isReplaying ? stopReplay : startReplay}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
          style={{
            background: isReplaying ? `${palette.accent}22` : `${palette.accent}18`,
            color: palette.accent,
            border: `1px solid ${palette.accent}44`,
          }}
          title={isReplaying ? 'Stop replay' : 'Replay My Year'}
        >
          {isReplaying ? (
            // Stop icon
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
              <rect x="1" y="1" width="8" height="8" rx="1" />
            </svg>
          ) : (
            // Play icon
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
              <polygon points="2,1 9,5 2,9" />
            </svg>
          )}
          {isReplaying ? 'Stop' : 'Replay My Year'}
        </button>

        {/* Month label during replay */}
        {isReplaying &&
          replayIndex !== null &&
          (() => {
            const recent = data.slice(-days);
            const currentDay = recent[Math.min(replayIndex - 1, recent.length - 1)];
            const month = currentDay
              ? new Date(currentDay.date).toLocaleString('default', {
                  month: 'short',
                  year: 'numeric',
                })
              : '';
            return (
              <span className="text-xs font-mono opacity-60" style={{ color: palette.accent }}>
                {month}
              </span>
            );
          })()}
      </div>

      {/* Progress bar */}
      {isReplaying && replayIndex !== null && (
        <div
          className="absolute bottom-0 left-0 h-0.5 transition-all"
          style={{
            width: `${(replayIndex / totalDays) * 100}%`,
            background: palette.accent,
            borderRadius: '0 2px 2px 0',
            opacity: 0.7,
          }}
        />
      )}

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
      {!timeLapseMode && (
        <div
          className="absolute bottom-3 right-4 text-xs opacity-40 select-none pointer-events-none"
          style={{ color: palette.accent }}
        >
          Drag to rotate · Scroll to zoom
        </div>
      )}

      {/* Time-Lapse UI Overlay */}
      {timeLapseMode && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {/* Playback Controls */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md shadow-sm border border-white/10"
            style={{ background: `${palette.bg}88` }}
          >
            <button
              onClick={() => {
                if (playbackIndex >= Math.min(days, data.length)) {
                  setPlaybackIndex(7);
                }
                setIsPlaying(!isPlaying);
              }}
              disabled={isExporting}
              className={`p-1.5 rounded-lg transition-colors text-white ${
                isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
              }`}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={() => {
                setPlaybackIndex(7);
                setIsPlaying(true);
              }}
              disabled={isExporting}
              className={`p-1.5 rounded-lg transition-colors text-white ${
                isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
              }`}
              aria-label="Restart"
            >
              <RotateCcw size={16} />
            </button>
            <div className="w-px h-5 bg-white/20 mx-1" />
            <div
              className="text-xs font-semibold px-1 min-w-[80px]"
              style={{ color: palette.accent }}
            >
              {playbackIndex > 0 &&
                (() => {
                  const recent = data.slice(-days);
                  const currentData = recent[Math.min(playbackIndex - 1, recent.length - 1)];
                  if (!currentData) return '...';
                  const dateObj = new Date(currentData.date);
                  return dateObj.toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  });
                })()}
            </div>
            {/* Export button */}
            <div className="w-px h-5 bg-white/20 mx-1" />
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-xs font-medium text-white ${
                isExporting ? 'bg-white/20 cursor-wait' : 'hover:bg-white/10'
              }`}
              title="Export as WebM video"
            >
              {isExporting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
