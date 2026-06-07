import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import ShareButtons from './ShareButtons';

const TEST_URL = 'https://commitpulse.vercel.app/dashboard/testuser';
const TEST_TITLE = 'Check out my CommitPulse streak!';

describe('ShareButtons', () => {
  it('renders LinkedIn and Twitter share buttons', () => {
    render(<ShareButtons url={TEST_URL} />);

    expect(screen.getByRole('link', { name: /linkedin/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /twitter/i })).toBeInTheDocument();
  });

  it('LinkedIn share link contains correctly encoded URL', () => {
    render(<ShareButtons url={TEST_URL} />);

    const linkedin = screen.getByRole('link', { name: /linkedin/i });
    expect(linkedin).toHaveAttribute(
      'href',
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(TEST_URL)}`
    );
  });

  it('Twitter share link contains correctly encoded URL and title', () => {
    render(<ShareButtons url={TEST_URL} title={TEST_TITLE} />);

    const twitter = screen.getByRole('link', { name: /twitter/i });
    const expected =
      `https://x.com/intent/tweet?url=${encodeURIComponent(TEST_URL)}` +
      `&text=${encodeURIComponent(TEST_TITLE)}`;
    expect(twitter).toHaveAttribute('href', expected);
  });

  it('Twitter share link omits text parameter when title is not provided', () => {
    render(<ShareButtons url={TEST_URL} />);

    const twitter = screen.getByRole('link', { name: /twitter/i });
    expect(twitter).toHaveAttribute(
      'href',
      `https://x.com/intent/tweet?url=${encodeURIComponent(TEST_URL)}`
    );
    expect(twitter.getAttribute('href')).not.toContain('&text=');
  });

  it('sets target="_blank" and rel="noopener noreferrer" on all share links', () => {
    render(<ShareButtons url={TEST_URL} />);

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
