import { FaLinkedin, FaXTwitter, FaLink } from 'react-icons/fa6';
import { copyToClipboard } from '@/utils/clipboard';

interface ShareButtonsProps {
  url: string;
  title?: string;
}

export default function ShareButtons({ url, title = '' }: ShareButtonsProps) {
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url
  )}`;
  const twitterUrl =
    `https://x.com/intent/tweet?url=${encodeURIComponent(url)}` +
    (title ? `&text=${encodeURIComponent(title)}` : '');

  const handleCopyLink = async (): Promise<void> => {
    try {
      await copyToClipboard(url);
    } catch {
      // Silently fail - clipboard access may be restricted in some environments
    }
  };

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
      <button type="button" onClick={handleCopyLink} aria-label="Copy link to clipboard">
        <FaLink size={24} aria-hidden="true" />
      </button>
    </div>
  );
}
