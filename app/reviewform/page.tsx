'use client';

import { useState } from 'react';
import Link from 'next/link';
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

function buildTestimonialIssueUrl(form: FormState): string {
  const issueUrl = new URL('https://github.com/JhaSourav07/commitpulse/issues/new');
  issueUrl.searchParams.set(
    'title',
    `Testimonial: ${form.name.trim()} shared CommitPulse feedback`
  );

  // Format handle with @ prefix
  const handleWithAt = form.handle.trim().startsWith('@')
    ? form.handle.trim()
    : `@${form.handle.trim()}`;

  issueUrl.searchParams.set(
    'body',
    [
      '## Testimonial Submission',
      '',
      `**Name:** ${form.name.trim()}`,
      `**GitHub or social handle:** ${handleWithAt}`,
      `**Platform:** ${form.platform}`,
      `**Accent Color:** ${form.accentColor}`,
      '',
      '## Feedback',
      '',
      form.message.trim(),
      '',
      '---',
      'Submitted from the CommitPulse review form.',
    ].join('\n')
  );
  issueUrl.searchParams.set('labels', 'testimonial');

  return issueUrl.toString();
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

  function handleSubmit() {
    if (!validate()) return;
    window.location.href = buildTestimonialIssueUrl(form);
  }

  // ── Form screen ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen overflow-hidden bg-white px-6 py-16 text-gray-950 dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-10 right-0 h-[360px] w-[360px] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <Link
          href="/"
          className="w-fit text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-600 dark:text-emerald-300"
        >
          Back to homepage
        </Link>

        <section className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/40 sm:p-10">
          <div className="mb-8 space-y-4">
            <p className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Wall of Love
            </p>
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                Share Your Experience
              </h1>
              <p className="max-w-2xl text-base leading-7 text-gray-600 dark:text-white/65">
                Tell us how CommitPulse helped your GitHub profile stand out. Submitting this form
                opens a prefilled GitHub issue so maintainers can review and publish your
                testimonial.
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Form Fields */}
            <div className="space-y-6">
              {/* Display Name */}
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

              {/* Platform & Handle */}
              <div className="space-y-1.5">
                <label
                  htmlFor="handle"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
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

              {/* Testimonial Message */}
              <div className="space-y-1.5">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Your testimonial
                </label>
                <textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) update('message', e.target.value);
                  }}
                  rows={5}
                  placeholder="CommitPulse made my README feel polished because..."
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

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="w-full py-3 px-6 rounded-lg text-sm font-bold
                  text-white transition-all duration-200
                  hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
                  dark:focus:ring-offset-[#161b22] shadow-lg shadow-emerald-500/25"
                style={{ backgroundColor: form.accentColor }}
              >
                Submit Testimonial →
              </button>
            </div>

            {/* Customization & Preview */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500">
                    Card Accent Color
                  </h2>
                  <div
                    className="h-1.5 w-20 rounded-full transition-colors duration-300"
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
              </div>

              <LivePreview form={form} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
