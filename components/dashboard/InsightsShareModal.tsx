'use client';

import { copyToClipboard } from '@/utils/clipboard';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, X, FileCode2 } from 'lucide-react';
import { FaTwitter, FaLinkedin } from 'react-icons/fa';
import { toast } from 'sonner';

export interface InsightsShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function InsightsShareModal({ isOpen, onClose, username }: InsightsShareModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const imageUrl = `/api/insights-og?user=${username}`;
  const absoluteImageUrl = `https://commitpulse.vercel.app/api/insights-og?user=${username}`;
  const dashboardUrl = `https://commitpulse.vercel.app/dashboard/${username}`;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${username}-contribution-insights.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Insights card downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download the insights card.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(
      `Check out my GitHub Contribution Insights! 🚀\n\nGenerate your own CommitPulse dashboard here: ${dashboardUrl}`
    );
    // Twitter works best if they download the image and attach it manually, or if the dashboard has this as the OG image.
    // For now we open intent with dashboard link.
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
    toast.info('Tip: Attach your downloaded Insights Card to your tweet!');
  };

  const handleLinkedIn = () => {
    const url = encodeURIComponent(dashboardUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener');
    toast.info('Tip: Attach your downloaded Insights Card to your post!');
  };

  const handleCopyMarkdown = useCallback(async () => {
    const markdown = `[![${username}'s Contribution Insights](${absoluteImageUrl})](${dashboardUrl})`;
    try {
      await copyToClipboard(markdown);
      toast.success('Markdown copied to clipboard!');
    } catch {
      toast.error('Failed to copy markdown');
    }
  }, [username, absoluteImageUrl, dashboardUrl]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-black/10 dark:border-white/10 shrink-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Share2 className="text-blue-500" size={24} />
                  Share Your Insights
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-[#111] mb-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Contribution Insights Preview"
                    className="w-full h-auto object-contain aspect-[1200/630]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={20} />
                    {isDownloading ? 'Downloading...' : 'Download Image'}
                  </button>
                  <button
                    onClick={handleCopyMarkdown}
                    className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white font-semibold transition-colors"
                  >
                    <FileCode2 size={20} />
                    Copy Markdown
                  </button>
                  <button
                    onClick={handleTwitter}
                    className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white font-semibold transition-colors"
                  >
                    <FaTwitter size={20} className="text-[#1DA1F2]" />
                    Share on X
                  </button>
                  <button
                    onClick={handleLinkedIn}
                    className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white font-semibold transition-colors"
                  >
                    <FaLinkedin size={20} className="text-[#0A66C2]" />
                    Share on LinkedIn
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
