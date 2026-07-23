'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  getContrastRatio,
  getContrastRating,
  findAccessibleColor,
} from '@/utils/color';

interface PresetColor {
  hex: string;
  label: string;
}

interface AdvancedColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets?: PresetColor[];
}

function SpectrumCursor({ top, left }: { top: number; left: number }) {
  return (
    <div
      className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ top: `${top}%`, left: `${left}%` }}
    >
      <div className="w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.3)]" />
    </div>
  );
}

function HueCursor({ left }: { left: number }) {
  return (
    <div
      className="absolute top-0 -translate-x-1/2 pointer-events-none z-10"
      style={{ left: `${left}%` }}
    >
      <div className="w-3 h-full rounded-sm border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]" />
    </div>
  );
}

export default function AdvancedColorPicker({
  value,
  onChange,
  presets = [],
}: AdvancedColorPickerProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'picker'>(
    presets.length > 0 ? 'presets' : 'picker'
  );
  const [hexError, setHexError] = useState('');
  const [isPicking, setIsPicking] = useState(false);
  const [eyedropperSupported, setEyedropperSupported] = useState<boolean | null>(null);

  const hsl = hexToHsl(value);

  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef<'none' | 'spectrum' | 'hue'>('none');

  const spectrumSize = 220;
  const hueHeight = 12;

  const drawSpectrum = useCallback(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    for (let y = 0; y < h; y++) {
      const lightness = 100 - (y / h) * 100;
      for (let x = 0; x < w; x++) {
        const saturation = (x / w) * 100;
        ctx.fillStyle = hslToHex(hsl.h, saturation, lightness);
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [hsl.h]);

  const drawHueSlider = useCallback(() => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    for (let x = 0; x < w; x++) {
      const hue = (x / w) * 360;
      ctx.fillStyle = hslToHex(hue, 100, 50);
      ctx.fillRect(x, 0, 1, h);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'picker') {
      drawSpectrum();
      drawHueSlider();
    }
  }, [activeTab, drawSpectrum, drawHueSlider]);

  const getSpectrumPos = useCallback(() => {
    return { sat: hsl.s, lum: hsl.l };
  }, [hsl.s, hsl.l]);

  const updateColor = useCallback(
    (hex: string) => {
      onChange(hex);
      setHexError('');
    },
    [onChange]
  );

  const handleSpectrumInteraction = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = spectrumCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
      const sat = Math.round((x / rect.width) * 100);
      const lum = Math.round(100 - (y / rect.height) * 100);
      const newHex = hslToHex(hsl.h, sat, lum);
      updateColor(newHex);
    },
    [hsl.h, updateColor]
  );

  const handleHueInteraction = useCallback(
    (clientX: number) => {
      const canvas = hueCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const newHue = Math.round((x / rect.width) * 360);
      const newHex = hslToHex(newHue, hsl.s, hsl.l);
      updateColor(newHex);
    },
    [hsl.s, hsl.l, updateColor]
  );

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggingRef.current === 'spectrum') {
        e.preventDefault();
        handleSpectrumInteraction(e.clientX, e.clientY);
      } else if (draggingRef.current === 'hue') {
        e.preventDefault();
        handleHueInteraction(e.clientX);
      }
    };

    const handleGlobalMouseUp = () => {
      draggingRef.current = 'none';
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleSpectrumInteraction, handleHueInteraction]);

  const handleEyedropper = async () => {
    if (typeof window === 'undefined') return;
    if (!('EyeDropper' in window)) {
      setEyedropperSupported(false);
      return;
    }
    try {
      setIsPicking(true);
      const eyeDropper = new (
        window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }
      ).EyeDropper();
      const result = await eyeDropper.open();
      updateColor(result.sRGBHex);
    } catch {
      // User cancelled
    } finally {
      setIsPicking(false);
    }
  };

  const handleHexChange = (raw: string) => {
    setHexError('');
    const cleaned = raw.replace('#', '');
    if (/^[0-9a-fA-F]{1,6}$/.test(cleaned) || cleaned === '') {
      const hex = `#${cleaned}`;
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        onChange(hex);
      }
    }
  };

  const handleHexBlur = () => {
    setHexError('');
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', raw: string) => {
    const num = Math.max(0, Math.min(255, parseInt(raw) || 0));
    const current = hexToRgb(value) || { r: 0, g: 0, b: 0 };
    const newRgb = { ...current, [channel]: num };
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    updateColor(newHex);
  };

  const contrastWhite = getContrastRatio(value, '#ffffff');
  const contrastBlack = getContrastRatio(value, '#000000');
  const whiteRating = getContrastRating(contrastWhite);
  const blackRating = getContrastRating(contrastBlack);
  const accessibleColor = whiteRating.level !== 'pass' ? findAccessibleColor(value, 'white') : null;

  const rgb = hexToRgb(value) || { r: 0, g: 0, b: 0 };

  const spectPos = getSpectrumPos();

  return (
    <div className="space-y-2.5">
      <div className="flex gap-1 rounded-lg bg-zinc-800/50 dark:bg-slate-200/10 p-0.5">
        {presets.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
              activeTab === 'presets'
                ? 'bg-zinc-700 dark:bg-white text-zinc-100 dark:text-slate-900 shadow-sm'
                : 'text-zinc-400 dark:text-slate-400 hover:text-zinc-200 dark:hover:text-slate-700'
            }`}
          >
            Presets
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('picker')}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
            activeTab === 'picker'
              ? 'bg-zinc-700 dark:bg-white text-zinc-100 dark:text-slate-900 shadow-sm'
              : 'text-zinc-400 dark:text-slate-400 hover:text-zinc-200 dark:hover:text-slate-700'
          }`}
        >
          Custom
        </button>
      </div>

      {activeTab === 'presets' && presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map(({ hex, label }) => (
            <button
              key={hex}
              type="button"
              title={label}
              onClick={() => updateColor(hex)}
              className={`w-9 h-9 rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
                value === hex
                  ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-300 scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      )}

      {activeTab === 'picker' && (
        <div className="rounded-lg border border-zinc-700/50 dark:border-slate-400/30 p-3 space-y-2.5">
          <div className="relative select-none">
            <canvas
              ref={spectrumCanvasRef}
              width={spectrumSize}
              height={Math.round(spectrumSize * 0.5)}
              className="w-full rounded-lg cursor-crosshair"
              style={{ height: `${Math.round(spectrumSize * 0.5)}px` }}
              onMouseDown={(e) => {
                draggingRef.current = 'spectrum';
                handleSpectrumInteraction(e.clientX, e.clientY);
              }}
            />
            <SpectrumCursor
              left={(spectPos.sat / 100) * 100}
              top={((100 - spectPos.lum) / 100) * 100}
            />
          </div>

          <div className="relative select-none">
            <canvas
              ref={hueCanvasRef}
              width={spectrumSize}
              height={hueHeight}
              className="w-full rounded-md cursor-pointer"
              style={{ height: `${hueHeight}px` }}
              onMouseDown={(e) => {
                draggingRef.current = 'hue';
                handleHueInteraction(e.clientX);
              }}
            />
            <HueCursor left={(hsl.h / 360) * 100} />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
                Hex
              </span>
              <div className="relative flex-1 max-w-[100px]">
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 dark:text-slate-400 font-mono">
                  #
                </span>
                <input
                  aria-label="Hex color code"
                  type="text"
                  value={value.replace('#', '')}
                  onChange={(e) => handleHexChange(e.target.value)}
                  onBlur={handleHexBlur}
                  maxLength={6}
                  className={`w-full pl-4 pr-1.5 py-1 text-[11px] font-mono rounded-md border bg-zinc-900 dark:bg-slate-100 ${
                    hexError
                      ? 'border-red-500 text-red-400 dark:text-red-600'
                      : 'border-zinc-700 dark:border-slate-400 text-zinc-200 dark:text-slate-800'
                  } focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors`}
                />
              </div>
              <div className="flex items-center gap-1">
                {(['r', 'g', 'b'] as const).map((ch) => (
                  <div key={ch} className="flex items-center gap-0.5">
                    <span className="text-[9px] font-mono text-zinc-500 dark:text-slate-400 uppercase">
                      {ch}
                    </span>
                    <input
                      aria-label="RGB color value"
                      type="number"
                      min={0}
                      max={255}
                      value={rgb[ch]}
                      onChange={(e) => handleRgbChange(ch, e.target.value)}
                      className="w-10 px-1 py-1 text-[10px] font-mono rounded-md border border-zinc-700 dark:border-slate-400 bg-zinc-900 dark:bg-slate-100 text-zinc-200 dark:text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-md border border-zinc-700 dark:border-slate-400 shrink-0 transition-colors duration-150"
                style={{ backgroundColor: value }}
              />
              <button
                type="button"
                onClick={handleEyedropper}
                disabled={isPicking}
                title="Pick color from page"
                className="w-8 h-8 flex items-center justify-center rounded-md border border-zinc-700 dark:border-slate-400 bg-zinc-900 dark:bg-slate-100 hover:bg-zinc-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                {isPicking ? (
                  <svg
                    className="w-3.5 h-3.5 text-blue-400 dark:text-blue-600 animate-pulse"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                ) : (
                  <svg
                    className="w-3.5 h-3.5 text-zinc-400 dark:text-slate-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M2 22l1-1h3l9-9" />
                    <path d="M3 21l9-9" />
                    <circle cx="17" cy="7" r="3" />
                    <path d="M15 5l-3 3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {hexError && (
            <p className="-mt-1.5 text-[10px] text-red-400 dark:text-red-500">{hexError}</p>
          )}
          {eyedropperSupported === false && (
            <p className="-mt-1.5 text-[10px] text-amber-500 dark:text-amber-400">
              Eyedropper not supported in this browser
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-zinc-700/30 dark:border-slate-400/20">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                Contrast
              </span>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  <div
                    className="w-3 h-3 rounded-sm border border-zinc-600 dark:border-slate-400 shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <span
                    className={`text-[10px] font-bold leading-none ${
                      whiteRating.level === 'pass'
                        ? 'text-emerald-400 dark:text-emerald-600'
                        : whiteRating.level === 'warn'
                          ? 'text-amber-400 dark:text-amber-500'
                          : 'text-red-400 dark:text-red-500'
                    }`}
                  >
                    {contrastWhite.toFixed(1)}
                  </span>
                  <span className="text-[8px] text-zinc-500 dark:text-slate-400 font-bold">W</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <div
                    className="w-3 h-3 rounded-sm border border-zinc-600 dark:border-slate-400 shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <span
                    className={`text-[10px] font-bold leading-none ${
                      blackRating.level === 'pass'
                        ? 'text-emerald-400 dark:text-emerald-600'
                        : blackRating.level === 'warn'
                          ? 'text-amber-400 dark:text-amber-500'
                          : 'text-red-400 dark:text-red-500'
                    }`}
                  >
                    {contrastBlack.toFixed(1)}
                  </span>
                  <span className="text-[8px] text-zinc-500 dark:text-slate-400 font-bold">B</span>
                </div>
              </div>
            </div>
            {accessibleColor && (
              <button
                type="button"
                onClick={() => updateColor(accessibleColor)}
                className="flex items-center gap-1 text-[10px] text-blue-400 dark:text-blue-600 underline hover:no-underline"
              >
                Fix contrast
                <div
                  className="w-3 h-3 rounded border border-zinc-600 dark:border-slate-400"
                  style={{ backgroundColor: accessibleColor }}
                />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
