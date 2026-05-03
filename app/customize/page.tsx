'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { themes } from '../../lib/svg/themes';
import { FONT_OPTIONS } from '../../lib/svg/generator';
const FONT_KEYS = Object.keys(FONT_OPTIONS);

type Scale = 'linear' | 'log';
type Size = 'small' | 'medium' | 'large';

const THEME_KEYS = Object.keys(themes);

const SPEEDS = [
  { value: '4s', label: 'Fast  (4s)' },
  { value: '8s', label: 'Default (8s)' },
  { value: '12s', label: 'Slow  (12s)' },
  { value: '20s', label: 'Ultra-slow (20s)' },
] as const;

const SIZES: { value: Size; label: string; dims: string }[] = [
  { value: 'small',  label: 'Small',  dims: '400×280' },
  { value: 'medium', label: 'Medium', dims: '600×420' },
  { value: 'large',  label: 'Large',  dims: '800×560' },
];

function stripHash(val: string) {
  return val.replace(/^#/, '');
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30 mb-2">
      {children}
    </p>
  );
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

function StyledSelect({
  id,
  value,
  onChange,
  children,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer"
    >
      {children}
    </select>
  );
}

function HexInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const isValidHex = /^[0-9a-fA-F]{6}$/.test(stripHash(value));
  const pickerValue = isValidHex ? `#${stripHash(value)}` : '#000000';
  const swatchColor = isValidHex ? pickerValue : null;

  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      <div className="relative flex items-center gap-2">
        <label
          htmlFor={`${id}-picker`}
          title="Open color picker"
          className="relative shrink-0 w-9 h-9 rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-colors"
          style={{ backgroundColor: swatchColor ?? '#1a1a1a' }}
        >
          {!swatchColor && (
            <span
              className="absolute inset-0"
              style={{
                backgroundImage: 'repeating-conic-gradient(#333 0% 25%, #1a1a1a 0% 50%)',
                backgroundSize: '8px 8px',
              }}
            />
          )}
          <input
            id={`${id}-picker`}
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(stripHash(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`Color picker for ${label}`}
          />
        </label>

        <div className="relative flex-1 flex items-center">
          <span className="absolute left-3 text-white/30 text-sm select-none pointer-events-none">
            #
          </span>
          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/^#/, ''))}
            placeholder={placeholder.replace(/^#/, '')}
            maxLength={6}
            className="w-full bg-black border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm font-mono text-emerald-300 placeholder:text-white/20 outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

export default function CustomizePage() {
  const [username, setUsername] = useState('jhasourav07');
  const [theme, setTheme] = useState('dark');
  const [bgHex, setBgHex] = useState('');
  const [accentHex, setAccentHex] = useState('');
  const [textHex, setTextHex] = useState('');
  const [scale, setScale] = useState<Scale>('linear');
  const [speed, setSpeed] = useState('8s');
  const [font, setFont] = useState('default');
  const [size, setSize] = useState<Size>('medium');
  const [copied, setCopied] = useState(false);

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('user', username || 'jhasourav07');
    const hasCustomColors = bgHex || accentHex || textHex;
    if (!hasCustomColors) params.set('theme', theme);
    if (bgHex) params.set('bg', stripHash(bgHex));
    if (accentHex) params.set('accent', stripHash(accentHex));
    if (textHex) params.set('text', stripHash(textHex));
    if (scale !== 'linear') params.set('scale', scale);
    if (speed !== '8s') params.set('speed', speed);
    if (font !== 'default') params.set('font', font);
    if (size !== 'medium') params.set('size', size);
    return params.toString();
  }, [username, theme, bgHex, accentHex, textHex, scale, speed, font, size]);

  const queryString = buildQueryParams();
  const previewSrc = `/api/streak?${queryString}`;
  const markdownSnippet = `![CommitPulse](https://commitpulse.vercel.app/api/streak?${queryString})`;

  const copyMarkdown = () => {
    navigator.clipboard.writeText(markdownSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[35%] h-[35%] bg-emerald-500/8 blur-[120px] rounded-full" />
        <div className="absolute top-[30%] -right-[10%] w-[25%] h-[25%] bg-purple-500/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/2 w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">
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
            Every change below updates the preview in real-time. Copy the Markdown snippet when
            you&apos;re done — no extra steps required.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* LEFT: Control Panel */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-[1.75rem] p-6 flex flex-col gap-6 sticky top-6"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400 mb-4">
                Controls
              </p>

              <div className="flex flex-col gap-5">
                {/* Username */}
                <ControlRow label="GitHub Username">
                  <input
                    id="username-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="jhasourav07"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-emerald-300 placeholder:text-white/20 outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </ControlRow>

                <div className="h-px bg-white/5" />

                {/* Theme */}
                <ControlRow label="Theme Preset">
                  <div className="relative">
                    <StyledSelect id="theme-select" value={theme} onChange={setTheme}>
                      {THEME_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </option>
                      ))}
                    </StyledSelect>
                    <div className="mt-2 flex gap-1.5">
                      {(['bg', 'accent', 'text'] as const).map((prop) => {
                        const color = themes[theme]?.[prop];
                        return color ? (
                          <span
                            key={prop}
                            title={`${prop}: #${color}`}
                            className="w-5 h-5 rounded-md border border-white/10"
                            style={{ backgroundColor: `#${color}` }}
                          />
                        ) : null;
                      })}
                      <span className="text-[11px] text-white/25 ml-1 self-center">
                        bg · accent · text
                      </span>
                    </div>
                  </div>
                </ControlRow>

                <div className="h-px bg-white/5" />

                {/* Custom hex overrides */}
                <div>
                  <SectionLabel>Custom Color Overrides</SectionLabel>
                  <p className="text-[11px] text-white/25 mb-3 leading-relaxed">
                    These override the theme preset above. Enter HEX values without&nbsp;
                    <code className="text-white/40">#</code>.
                  </p>
                  <div className="flex flex-col gap-3">
                    <HexInput id="bg-hex-input" label="Background" value={bgHex} onChange={setBgHex} placeholder="e.g. 0a0a0a" />
                    <HexInput id="accent-hex-input" label="Accent / Tower Color" value={accentHex} onChange={setAccentHex} placeholder="e.g. 00ffaa" />
                    <HexInput id="text-hex-input" label="Text / Label Color" value={textHex} onChange={setTextHex} placeholder="e.g. ffffff" />
                  </div>
                  {(bgHex || accentHex || textHex) && (
                    <button
                      id="clear-overrides-btn"
                      onClick={() => { setBgHex(''); setAccentHex(''); setTextHex(''); }}
                      className="mt-3 text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      ✕ Clear overrides
                    </button>
                  )}
                </div>

                <div className="h-px bg-white/5" />

                {/* Badge Size — NEW */}
                <ControlRow label="Badge Size">
                  <div className="grid grid-cols-3 gap-2">
                    {SIZES.map((s) => (
                      <button
                        key={s.value}
                        id={`size-${s.value}-btn`}
                        onClick={() => setSize(s.value)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                          size === s.value
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                            : 'bg-black border border-white/8 text-white/30 hover:text-white/60 hover:border-white/20'
                        }`}
                      >
                        <span>{s.label}</span>
                        <span className="text-[10px] opacity-60">{s.dims}</span>
                      </button>
                    ))}
                  </div>
                </ControlRow>

                <div className="h-px bg-white/5" />

                {/* Scale */}
                <ControlRow label="Tower Height Scaling">
                  <div className="grid grid-cols-2 gap-2">
                    {(['linear', 'log'] as Scale[]).map((s) => (
                      <button
                        key={s}
                        id={`scale-${s}-btn`}
                        onClick={() => setScale(s)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                          scale === s
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                            : 'bg-black border border-white/8 text-white/30 hover:text-white/60 hover:border-white/20'
                        }`}
                      >
                        {s === 'linear' ? 'Linear' : 'Logarithmic'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/25 mt-1.5 leading-relaxed">
                    {scale === 'log'
                      ? 'Log mode compresses extreme outliers — great for power committers.'
                      : 'Linear mode shows raw commit counts as tower heights.'}
                  </p>
                </ControlRow>

                {/* Font Style */}
                <ControlRow label="Font Style">
                  <div className="relative">
                    <StyledSelect id="font-select" value={font} onChange={setFont}>
                      {FONT_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {FONT_OPTIONS[k].title}
                        </option>
                      ))}
                    </StyledSelect>
                  </div>
                </ControlRow>

                <div className="h-px bg-white/5" />

                {/* Scan speed */}
                <ControlRow label="Radar Scan Speed">
                  <div className="relative">
                    <StyledSelect id="speed-select" value={speed} onChange={setSpeed}>
                      {SPEEDS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </StyledSelect>
                  </div>
                </ControlRow>
              </div>
            </div>
          </motion.aside>

          {/* RIGHT: Preview + Export */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[1.75rem] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400 mb-5">
                Live Preview
              </p>
              <div className="group relative">
                <div className="absolute -inset-px bg-gradient-to-br from-emerald-500/20 to-purple-500/20 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-lg pointer-events-none" />
                <div className="relative bg-[#050505] border border-white/8 rounded-[1.25rem] overflow-hidden flex items-center justify-center p-6 min-h-[280px]">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent animate-[pulse_3s_ease-in-out_infinite] pointer-events-none" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={previewSrc}
                    src={previewSrc}
                    alt="CommitPulse live preview"
                    width={600}
                    height={420}
                    className="max-w-full h-auto drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-opacity duration-300"
                  />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-white/20 text-center">
                Preview updates on every change · Hosted badge is cached at UTC midnight
              </p>
            </div>

            {/* Export */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[1.75rem] p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
                  Markdown Export
                </p>
                <button
                  id="copy-markdown-btn"
                  onClick={copyMarkdown}
                  className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    copied
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      : 'bg-white text-black hover:scale-[1.03] active:scale-[0.97]'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Markdown
                    </>
                  )}
                </button>
              </div>
              <div className="bg-black/60 border border-white/8 rounded-xl px-5 py-4 overflow-x-auto">
                <code className="text-emerald-300 text-xs font-mono leading-relaxed break-all whitespace-pre-wrap">
                  {markdownSnippet}
                </code>
              </div>
              <p className="mt-4 text-[11px] text-white/20 leading-relaxed">
                Paste this into your GitHub profile&apos;s{' '}
                <code className="text-white/35">README.md</code> — the badge renders server-side,
                no script required.
              </p>
            </div>

            {/* Active Parameters */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[1.75rem] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/30 mb-4">
                Active Parameters
              </p>
              <div className="flex flex-wrap gap-2">
                {queryString.split('&').map((pair) => {
                  const [k, v] = pair.split('=');
                  return (
                    <span key={k} className="inline-flex items-center gap-1.5 bg-white/4 border border-white/8 rounded-lg px-3 py-1.5 text-xs font-mono">
                      <span className="text-purple-400">{decodeURIComponent(k)}</span>
                      <span className="text-white/20">=</span>
                      <span className="text-emerald-400">{decodeURIComponent(v)}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}