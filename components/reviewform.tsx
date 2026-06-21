'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AdvancedColorPicker from './AdvancedColorPicker';

const ACCENT_PRESETS = [
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#8b5cf6', label: 'Purple' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#f43f5e', label: 'Rose' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#3b82f6', label: 'Blue' },
  { hex: '#ec4899', label: 'Pink' },
  { hex: '#14b8a6', label: 'Teal' },
];

export default function SubmitReviewPage() {
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    platform: 'twitter' as 'twitter' | 'github',
    message: '',
    accentColor: '#10b981',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (formData.name.trim().length === 0) {
      setError('Please enter your full name.');
      return;
    }
    if (formData.handle.trim().length === 0) {
      setError('Please enter your handle.');
      return;
    }
    if (!/^@?[\w.-]+$/.test(formData.handle.trim())) {
      setError('Handle must be a valid username (letters, numbers, _ . -).');
      return;
    }
    if (formData.message.trim().length < 10) {
      setError('Message must be at least 10 characters.');
      return;
    }
    if (formData.message.trim().length > 1000) {
      setError('Message must be at most 1000 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          handle: formData.handle.trim(),
          platform: formData.platform,
          message: formData.message.trim(),
          accentColor: formData.accentColor,
        }),
      });

      const data = (await res.json()) as { success: boolean; message: string };

      if (!res.ok || !data.success) {
        setError(data.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setSubmitted(true);

      // Reset form after success message
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          name: '',
          handle: '',
          platform: 'twitter',
          message: '',
          accentColor: '#10b981',
        });
      }, 3000);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-20 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          ← Back to Wall of Love
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm mb-4">
            ✨ Share Your Story
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">Loved CommitPulse?</h1>
          <p className="text-xl text-zinc-400 max-w-md mx-auto">
            Tell us how it transformed your GitHub profile
          </p>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-500/10 to-purple-500/10 border border-emerald-500/30 rounded-3xl p-12 text-center"
          >
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold mb-3">Thank You!</h2>
            <p className="text-zinc-400 text-lg">
              Your testimonial has been received. It will be featured soon!
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Alex Chen"
                />
              </div>

              {/* Handle */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Handle (@username)
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={formData.handle}
                  onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="@alexcodes"
                />
              </div>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-3">Platform</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, platform: 'twitter' })}
                  className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-3 ${
                    formData.platform === 'twitter'
                      ? 'border-[#1DA1F2] bg-[#1DA1F2]/10'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-[#1DA1F2]">𝕏</span>
                  <span>Twitter / X</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, platform: 'github' })}
                  className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-3 ${
                    formData.platform === 'github'
                      ? 'border-gray-400 bg-white/5'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span>🐙</span>
                  <span>GitHub</span>
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-3">Accent Color</label>
              <AdvancedColorPicker
                value={formData.accentColor}
                onChange={(color) => setFormData({ ...formData, accentColor: color })}
                presets={ACCENT_PRESETS}
              />

              {/* Live Preview */}
              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  Card Preview
                </p>
                <div className="relative overflow-hidden rounded-xl border border-black/10 bg-white/70 p-4 shadow-lg backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0c0c0c]/90">
                  <div
                    className="absolute top-0 left-[10%] right-[10%] h-[2px] rounded-full"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${formData.accentColor}, transparent)`,
                    }}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full border border-black/5 bg-zinc-700 dark:border-white/10 shadow-sm flex items-center justify-center text-xs text-zinc-400">
                        {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {formData.name || 'Your Name'}
                          </p>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill={formData.accentColor}
                          >
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
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          @{formData.handle || 'handle'}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                      {formData.message || 'Your testimonial message will appear here...'}
                    </p>
                  </div>
                  <div
                    className="absolute -right-10 -top-10 h-24 w-24 rounded-full blur-3xl opacity-60"
                    style={{ background: `${formData.accentColor}15` }}
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Your Experience
              </label>
              <textarea
                required
                rows={6}
                minLength={10}
                maxLength={1000}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                placeholder="CommitPulse completely transformed how my GitHub profile looks. The 3D visualization is stunning..."
              />
              <p className="text-right text-xs text-zinc-500 mt-1">
                {formData.message.length}/1000
              </p>
            </div>

            {/* Error message */}
            {error && (
              <p
                role="alert"
                className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3"
              >
                {error}
              </p>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-purple-600 to-pink-600 font-semibold text-lg flex items-center justify-center gap-3 disabled:opacity-70 transition-all"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  Share My Testimonial
                  <span>→</span>
                </>
              )}
            </motion.button>

            <p className="text-center text-xs text-zinc-500">
              Your review will be reviewed before appearing on the Wall of Love.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
