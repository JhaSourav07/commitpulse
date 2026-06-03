import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ShareButtons from './ShareButtons';

describe('ShareButtons accessibility behavior', () => {
  const url = 'https://example.com';
  const title = 'Test Title';

  const renderShareButtons = () => render(<ShareButtons url={url} title={title} />);

  it('provides an accessible label for the LinkedIn share link', () => {
    renderShareButtons();

    const link = screen.getByRole('link', {
      name: 'Share on LinkedIn (opens in a new tab)',
    });

    expect(link).toBeTruthy();
  });

  it('provides an accessible label for the X/Twitter share link', () => {
    renderShareButtons();

    const link = screen.getByRole('link', {
      name: 'Share on X / Twitter (opens in a new tab)',
    });

    expect(link).toBeTruthy();
  });

  it('marks social media icons as decorative', () => {
    const { container } = renderShareButtons();

    const icons = container.querySelectorAll('svg[aria-hidden="true"]');

    expect(icons).toHaveLength(2);
  });

  it('opens LinkedIn share link in a new tab securely', () => {
    renderShareButtons();

    const link = screen.getByRole('link', {
      name: 'Share on LinkedIn (opens in a new tab)',
    });

    expect(link.getAttribute('target')).toBe('_blank');

    const rel = link.getAttribute('rel') ?? '';

    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  it('opens X/Twitter share link in a new tab securely', () => {
    renderShareButtons();

    const link = screen.getByRole('link', {
      name: 'Share on X / Twitter (opens in a new tab)',
    });

    expect(link.getAttribute('target')).toBe('_blank');

    const rel = link.getAttribute('rel') ?? '';

    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });
});
