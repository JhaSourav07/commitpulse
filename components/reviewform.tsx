'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

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

  const accentColors = [
    '#10b981',
    '#8b5cf6',
    '#06b6d4',
    '#f43f5e',
    '#f59e0b',
    '#3b82f6',
    '#ec4899',
    '#14b8a6',
  ];

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
              <div className="flex gap-3 flex-wrap">
                {accentColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, accentColor: color })}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      formData.accentColor === color
                        ? 'border-white scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
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
