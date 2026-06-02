import { FaLinkedin, FaXTwitter } from 'react-icons/fa6';

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

  return (
    <div className="flex gap-3">
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
      >
        <FaLinkedin size={24} aria-hidden="true" />
      </a>

      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
        <FaXTwitter size={24} aria-hidden="true" />
      </a>
    </div>
  );
}
