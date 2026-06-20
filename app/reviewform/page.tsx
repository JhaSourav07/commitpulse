'use client';

import { useState } from 'react';
import AdvancedColorPicker from '@/components/AdvancedColorPicker';

// ── Types ─────────────────────────────────────────────────────────────────────
type Platform = 'twitter' | 'github';

interface FormState {
  name: string;
  handle: string;
  platform: Platform;
  message: string;
  accentColor: string;
}

// Preset accent colors matching the project's theme palette
const ACCENT_PRESETS = [
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#58a6ff', label: 'Blue' },
  { hex: '#bd93f9', label: 'Dracula' },
  { hex: '#ff00ff', label: 'Neon' },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#facc15', label: 'Yellow' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function PlatformToggle({ value, onChange }: { value: Platform; onChange: (p: Platform) => void }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 w-fit">
      {(['github', 'twitter'] as Platform[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-150
            ${
              value === p
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-white dark:bg-[#0d1117] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          {p === 'github' ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          )}
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );
}

function LivePreview({ form }: { form: FormState }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#161b22] shadow-sm p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
        Card Preview
      </p>
      <div className="relative overflow-hidden rounded-xl border border-black/5 bg-white/70 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0c0c0c]/90 dark:shadow-2xl dark:shadow-black/40">
        <div
          className="absolute top-0 left-[10%] right-[10%] h-[2px] rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${form.accentColor}, transparent)`,
          }}
        />
        <div className="relative z-10">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-full border border-black/5 bg-slate-200 dark:border-white/10 dark:bg-zinc-700 shadow-sm flex items-center justify-center text-xs text-slate-500 dark:text-zinc-400">
              {form.name ? form.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {form.name || 'Your Name'}
                </p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={form.accentColor}>
                  <path d="M9 12l2 2 4-4m6 2a8 8 0 11-16 0 8 8 0 0116 0z" />
                  <path
                    d="M9 12l2 2 4-4"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  @{form.handle || 'handle'}
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
            {form.message || 'Your testimonial message will appear here...'}
          </p>
        </div>
        <div
          className="absolute -right-10 -top-10 h-24 w-24 rounded-full blur-3xl opacity-60"
          style={{ background: `${form.accentColor}15` }}
        />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReviewFormPage() {
  const [form, setForm] = useState<FormState>({
    name: '',
    handle: '',
    platform: 'github',
    message: '',
    accentColor: '#10b981',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const msgLen = form.message.length;

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) {
      next.name = 'Name is required.';
    } else if (form.name.trim().length > 100) {
      next.name = 'Name must be at most 100 characters.';
    }

    if (!form.handle.trim()) {
      next.handle = 'Handle is required.';
    } else if (form.handle.trim().length > 50) {
      next.handle = 'Handle must be at most 50 characters.';
    } else if (!/^@?[\w.-]+$/.test(form.handle.trim())) {
      next.handle = 'Handle must be a valid username (letters, numbers, . _ -)';
    }

    if (form.message.trim().length < 10) {
      next.message = 'Message must be at least 10 characters.';
    } else if (form.message.trim().length > 1000) {
      next.message = 'Message must be at most 1000 characters.';
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(form.accentColor)) {
      next.accentColor = 'Please select or enter a valid hex color.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit() {
    setServerError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          handle: form.handle.trim(),
          platform: form.platform,
          message: form.message.trim(),
          accentColor: form.accentColor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || 'Something went wrong. Please try again.');
        return;
      }

      setIsSuccess(true);
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-5 p-8 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#161b22] shadow-xl">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${form.accentColor}20` }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: form.accentColor }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Thank you for your feedback!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Your testimonial has been received. It will be reviewed and featured on the Wall of Love
            soon.
          </p>
          <button
            onClick={() => {
              setIsSuccess(false);
              setForm({
                name: '',
                handle: '',
                platform: 'github',
                message: '',
                accentColor: '#10b981',
              });
              setErrors({});
            }}
            className="text-sm underline underline-offset-4 transition-colors"
            style={{ color: form.accentColor }}
          >
            Submit another review
          </button>
        </div>
      </main>
    );
  }

  // ── Form screen ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-500 dark:text-blue-400">
            Wall of Love
          </span>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Share Your Experience
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Loving CommitPulse? Tell the world — your testimonial may be featured on the homepage.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#161b22] shadow-xl divide-y divide-slate-100 dark:divide-slate-700/60">
          {/* Section 1 — Identity */}
          <div className="p-6 space-y-4">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500">
              Your Identity
            </h2>

            {/* Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Display Name
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Sourav Jha"
                maxLength={100}
                className={`w-full px-4 py-2.5 rounded-lg text-sm
                  bg-slate-50 dark:bg-[#0d1117]
                  border ${errors.name ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}
                  text-slate-900 dark:text-slate-100
                  placeholder:text-slate-400 dark:placeholder:text-slate-600
                  focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                  focus:border-transparent transition-all duration-200`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Platform toggle + Handle */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Platform & Handle
              </label>
              <PlatformToggle value={form.platform} onChange={(p) => update('platform', p)} />
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500 pointer-events-none select-none text-sm">
                  @
                </span>
                <input
                  id="handle"
                  type="text"
                  value={form.handle}
                  onChange={(e) => update('handle', e.target.value)}
                  placeholder={
                    form.platform === 'github' ? 'your-github-handle' : 'your-twitter-handle'
                  }
                  maxLength={50}
                  autoComplete="off"
                  spellCheck={false}
                  className={`w-full pl-8 pr-4 py-2.5 rounded-lg text-sm
                    bg-slate-50 dark:bg-[#0d1117]
                    border ${errors.handle ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}
                    text-slate-900 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                    focus:border-transparent transition-all duration-200`}
                />
              </div>
              {errors.handle && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.handle}</p>
              )}
            </div>
          </div>

          {/* Section 2 — Message */}
          <div className="p-6 space-y-4">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500">
              Your Testimonial
            </h2>
            <div className="space-y-1.5">
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) update('message', e.target.value);
                }}
                rows={5}
                placeholder="CommitPulse completely transformed my GitHub profile. The isometric 3D view is unlike anything I've seen..."
                className={`w-full px-4 py-3 rounded-lg text-sm resize-none
                  bg-slate-50 dark:bg-[#0d1117]
                  border ${errors.message ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}
                  text-slate-900 dark:text-slate-100
                  placeholder:text-slate-400 dark:placeholder:text-slate-600
                  focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                  focus:border-transparent transition-all duration-200`}
              />
              <div className="flex items-center justify-between">
                {errors.message ? (
                  <p className="text-xs text-red-500 dark:text-red-400">{errors.message}</p>
                ) : (
                  <span className="text-xs text-slate-400">Min 10 characters</span>
                )}
                <span
                  className={`text-xs ml-auto transition-colors ${msgLen > 900 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}
                >
                  {msgLen}/1000
                </span>
              </div>
            </div>
          </div>

          {/* Section 3 — Accent color */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500">
                Card Accent Color
              </h2>
              <div
                className="h-1 w-20 rounded-full transition-colors duration-300"
                style={{ backgroundColor: form.accentColor }}
              />
            </div>
            <AdvancedColorPicker
              value={form.accentColor}
              onChange={(c) => update('accentColor', c)}
              presets={ACCENT_PRESETS}
            />
            {errors.accentColor && (
              <p className="text-xs text-red-500 dark:text-red-400">{errors.accentColor}</p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500">
              This color will be used to style your testimonial card on the Wall of Love.
            </p>
            <LivePreview form={form} />
          </div>

          {/* Submit */}
          <div className="p-6 space-y-4">
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm
                  bg-red-50 dark:bg-red-900/20
                  border border-red-200 dark:border-red-800/50
                  text-red-700 dark:text-red-400"
              >
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {serverError}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-lg text-sm font-semibold
                text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                dark:focus:ring-offset-[#161b22]
                shadow-lg"
              style={{ backgroundColor: form.accentColor }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting…
                </span>
              ) : (
                'Submit Testimonial →'
              )}
            </button>

            <p className="text-center text-xs text-slate-400 dark:text-slate-600">
              All testimonials are reviewed before appearing on the homepage.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
