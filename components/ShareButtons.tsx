'use client';
import { useState, useCallback } from 'react';
import { FaLinkedin, FaXTwitter, FaLink } from 'react-icons/fa6';
import { copyToClipboard } from '../utils/clipboard';

interface ShareButtonsProps {
  url: string;
  title?: string;
}

export default function ShareButtons({ url, title = '' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url
  )}`;
  const twitterUrl =
    `https://x.com/intent/tweet?url=${encodeURIComponent(url)}` +
    (title ? `&text=${encodeURIComponent(title)}` : '');

  const handleCopyLink = useCallback(async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  return (
    <div className="flex gap-3">
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn (opens in a new tab)"
      >
        <FaLinkedin size={24} aria-hidden="true" />
      </a>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X / Twitter (opens in a new tab)"
      >
        <FaXTwitter size={24} aria-hidden="true" />
      </a>
      <button
        type="button"
        onClick={handleCopyLink}
        aria-label={copied ? 'Link copied!' : 'Copy link to clipboard'}
        aria-live="polite"
        className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
      >
        <FaLink size={24} aria-hidden="true" />
      </button>
    </div>
  );
}
