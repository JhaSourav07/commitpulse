'use client';

import { useState, useEffect, useRef } from 'react';
import { X, GitPullRequest, AlertCircle } from 'lucide-react';

export interface SuggestRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: { repoUrl: string; reason: string }) => void | Promise<void>;
}

export default function SuggestRepoModal({ isOpen, onClose, onSubmit }: SuggestRepoModalProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = '';
      setRepoUrl('');
      setReason('');
      setErrorMsg('');
      setIsSubmitting(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const charCount = reason.length;
  const isReasonTooShort = reason.trim().length < 10;
  const isFormValid = repoUrl.trim().length > 0 && !isReasonTooShort;

  // Counter styling: amber for < 50, green for 100+, default text color for 50-99
  const getCounterColorClass = () => {
    if (charCount < 50) return 'text-amber-600 dark:text-amber-400';
    if (charCount >= 100) return 'text-emerald-500 dark:text-emerald-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      if (isReasonTooShort) {
        setErrorMsg('Reason must be at least 10 characters long.');
      } else if (!repoUrl.trim()) {
        setErrorMsg('Please enter a repository URL or name.');
      }
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      if (onSubmit) {
        await onSubmit({ repoUrl: repoUrl.trim(), reason: reason.trim() });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit repository suggestion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Suggest a Repository"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-2xl focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <GitPullRequest size={20} className="text-emerald-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Suggest a Repository
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close suggest repository modal"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Repo URL Input */}
          <div>
            <label
              htmlFor="suggest-repo-url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Repository URL or Name <span className="text-red-500">*</span>
            </label>
            <input
              id="suggest-repo-url"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="e.g. facebook/react or https://github.com/facebook/react"
              className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Reason Field */}
          <div>
            <label
              htmlFor="suggest-repo-reason"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Reason for Suggestion <span className="text-red-500">*</span>
            </label>
            <textarea
              id="suggest-repo-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Explain why this repo is great for beginners — e.g. good documentation, active maintainers, labelled good-first-issues..."
              className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              required
            />

            {/* Live Character Counter */}
            <div className="flex items-center justify-between mt-1 text-xs">
              <div>
                {/* Quality Hint Message when char count < 50 */}
                {charCount < 50 && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Add more detail to help reviewers approve this faster.
                  </span>
                )}
              </div>
              <span
                data-testid="reason-char-counter"
                className={`font-mono ${getCounterColorClass()}`}
              >
                {charCount} / 1000
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
