import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { SocialsSection } from '../components/sections/SocialsSection';

vi.mock('./socials', () => ({
  SOCIALS: [
    {
      id: 'github',
      name: 'GitHub',
      type: 'simpleicon',
      iconUrl: '/github.svg',
      category: 'Development',
      placeholder: 'https://github.com/yourusername',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      type: 'simpleicon',
      iconUrl: '/linkedin.svg',
      category: 'Professional',
      placeholder: 'https://linkedin.com/in/yourname',
    },
  ],
  SOCIAL_CATEGORIES: ['Development', 'Professional'],
}));

describe('SocialsSection Accessibility Standards & Screen Reader Compliance', () => {
  const defaultProps = {
    selected: ['github'],
    socialLinks: {
      github: 'https://github.com/testuser',
    },
    onSelectedChange: vi.fn(),
    onLinkChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Case 1: search field remains keyboard accessible', () => {
    render(<SocialsSection {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search platforms...');

    searchInput.focus();

    expect(searchInput).toHaveFocus();
  });

  it('Case 2: exposes navigation tabs as accessible tab controls', () => {
    render(<SocialsSection {...defaultProps} />);

    expect(
      screen.getByRole('tab', {
        name: /pick platforms/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/② Add Links/i)).toBeInTheDocument();
  });

  it('Case 3: exposes category filters as keyboard reachable controls', () => {
    render(<SocialsSection {...defaultProps} />);

    expect(
      screen.getByRole('button', {
        name: 'Development',
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Professional',
      })
    ).toBeInTheDocument();
  });

  it('Case 4: platform selectors expose readable accessible names', () => {
    render(<SocialsSection {...defaultProps} />);

    expect(
      screen.getByRole('button', {
        name: /github/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /linkedin/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByAltText('GitHub')).toBeInTheDocument();
    expect(screen.getByAltText('LinkedIn')).toBeInTheDocument();
  });

  it('Case 5: selected platforms provide keyboard accessible URL fields', () => {
    render(<SocialsSection {...defaultProps} />);

    const linksTab = screen
      .getAllByRole('tab')
      .find((btn) => btn.textContent?.includes('Add Links'));

    expect(linksTab).toBeDefined();

    fireEvent.click(linksTab!);

    const urlInput = screen.getByDisplayValue('https://github.com/testuser');

    urlInput.focus();

    expect(urlInput).toHaveFocus();
  });
});
