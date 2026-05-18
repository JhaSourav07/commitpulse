'use client';

import { useCallback, useState, type ReactElement } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ControlsPanel } from './components/ControlsPanel';
import { ExportPanel } from './components/ExportPanel';
import type { ExportFormat, Scale } from './types';
import { getExportSnippet, stripHash } from './utils';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomizePage(): ReactElement {
  const [username, setUsername] = useState('');
  const [theme, setTheme] = useState('dark');
  const [bgHex, setBgHex] = useState('');
  const [accentHex, setAccentHex] = useState('');
  const [textHex, setTextHex] = useState('');
  const [scale, setScale] = useState<Scale>('linear');
  const [speed, setSpeed] = useState('8s');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown');
  const [copied, setCopied] = useState(false);
  const trimmedUsername = username.trim();
  const hasUsername = trimmedUsername.length > 0;
  const isAutoTheme = theme === 'auto';

  // Clear custom hex overrides when switching to auto — fixed colors
  // conflict with the dual-palette prefers-color-scheme switching.
  const handleThemeChange = useCallback((newTheme: string): void => {
    setTheme(newTheme);
    if (newTheme === 'auto') {
      setBgHex('');
      setAccentHex('');
      setTextHex('');
    }
  }, []);

  // ── buildQueryParams ──────────────────────────────────────────────────────

  const buildQueryParams = useCallback((): string => {
    const params = new URLSearchParams();

    if (hasUsername) {
      params.set('user', trimmedUsername);
    }

    if (isAutoTheme) {
      // Auto always emits theme=auto — no custom color params
      params.set('theme', 'auto');
    } else {
      const hasCustomColors = bgHex || accentHex || textHex;

      // Custom hex colors take priority over theme
      if (!hasCustomColors) {
        params.set('theme', theme);
      }
      if (bgHex) params.set('bg', stripHash(bgHex));
      if (accentHex) params.set('accent', stripHash(accentHex));
      if (textHex) params.set('text', stripHash(textHex));
    }

    if (scale !== 'linear') params.set('scale', scale);
    if (speed !== '8s') params.set('speed', speed);

    return params.toString();
  }, [hasUsername, trimmedUsername, theme, isAutoTheme, bgHex, accentHex, textHex, scale, speed]);

  const queryString = buildQueryParams();
  const previewSrc = `/api/streak?${queryString}`;
  const exportSnippet = getExportSnippet(exportFormat, queryString);

  const copyExportSnippet = (): void => {
    if (!hasUsername) return;

    navigator.clipboard.writeText(exportSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[35%] h-[35%] bg-emerald-500/8 blur-[120px] rounded-full" />
        <div className="absolute top-[30%] -right-[10%] w-[25%] h-[25%] bg-purple-500/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/2 w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">
        {/* ── Top Bar ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link
            href="/"
            id="back-to-home-link"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Home
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <div>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
              Customization Studio
            </span>
          </div>
        </motion.div>

        {/* ── Page heading ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight mb-2">
            Fine-tune your monolith.
          </h1>
          <p className="text-gray-500 text-sm max-w-xl">
            Every change below updates the preview in real-time. Copy the export snippet when
            you&apos;re done. No extra steps required.
          </p>
        </motion.div>

        {/* ── Split layout ─────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* ════ LEFT: Control Panel ════════════════════════════════════════ */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-[1.75rem] p-6 flex flex-col gap-6 sticky top-6"
          >
            <ControlsPanel
              username={username}
              theme={theme}
              bgHex={bgHex}
              accentHex={accentHex}
              textHex={textHex}
              scale={scale}
              speed={speed}
              onUsernameChange={setUsername}
              onThemeChange={handleThemeChange}
              onBgHexChange={setBgHex}
              onAccentHexChange={setAccentHex}
              onTextHexChange={setTextHex}
              onScaleChange={setScale}
              onSpeedChange={setSpeed}
              onClearOverrides={() => {
                setBgHex('');
                setAccentHex('');
                setTextHex('');
              }}
            />
          </motion.aside>

          {/* ════ RIGHT: Preview + Export ════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col gap-6"
          >
            {/* Live Preview */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[1.75rem] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400 mb-5">
                Live Preview
              </p>
              <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-black">
                {hasUsername ? (
                  <img src={previewSrc} alt="CommitPulse Preview" className="max-w-full h-auto" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-6">
                    <p className="text-white/70 text-lg font-semibold mb-2">No Preview Yet</p>

                    <p className="text-sm text-white/30 max-w-md">
                      Enter your GitHub username in the control panel to generate a live preview.
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-3 text-[11px] text-white/20 text-center">
                {hasUsername
                  ? 'Preview updates on every change. Hosted badge is cached at UTC midnight'
                  : 'Add a username to enable live preview and export snippets'}
              </p>
            </div>

            <ExportPanel
              format={exportFormat}
              snippet={exportSnippet}
              copied={copied}
              hasUsername={hasUsername}
              onFormatChange={setExportFormat}
              onCopy={copyExportSnippet}
            />

            {/* URL breakdown */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[1.75rem] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/30 mb-4">
                Active Parameters
              </p>
              <div className="flex flex-wrap gap-2">
                {(hasUsername ? queryString.split('&') : ['user=your-github-username']).map(
                  (pair) => {
                    const [k, v] = pair.split('=');
                    return (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1.5 bg-white/4 border border-white/8 rounded-lg px-3 py-1.5 text-xs font-mono"
                      >
                        <span className="text-purple-400">{decodeURIComponent(k)}</span>
                        <span className="text-white/20">=</span>
                        <span className="text-emerald-400">{decodeURIComponent(v)}</span>
                      </span>
                    );
                  }
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
