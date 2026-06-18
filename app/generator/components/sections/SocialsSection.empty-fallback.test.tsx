import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SocialsSection } from './SocialsSection';

vi.mock('../../data/socials', () => ({
  SOCIALS: [
    {
      id: 'github',
      name: 'GitHub',
      type: 'simpleicon',
      iconUrl: '/github.svg',
      category: 'Development',
      placeholder: 'https://github.com/username',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      type: 'simpleicon',
      iconUrl: '/twitter.svg',
      category: 'Social',
      placeholder: 'https://twitter.com/username',
    },
  ],
  SOCIAL_CATEGORIES: ['Development', 'Social'],
}));

describe('SocialsSection Edge Cases & Empty/Missing Inputs Verification', () => {
  const mockOnSelectedChange = vi.fn();
  const mockOnLinkChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders safely with empty selected array and empty social links', () => {
    render(
      <SocialsSection
        selected={[]}
        socialLinks={{}}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    expect(screen.getByText('Socials')).toBeInTheDocument();
    expect(screen.getByText('2 platforms')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search platforms...')).toBeInTheDocument();
  });

  it('shows fallback message when links tab is opened with no selected platforms', () => {
    render(
      <SocialsSection
        selected={[]}
        socialLinks={{}}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: /add links/i }));

    expect(screen.getByText('No platforms selected yet')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /pick platforms first/i })).toBeInTheDocument();
  });

  it('shows empty search fallback when no platforms match search query', () => {
    render(
      <SocialsSection
        selected={[]}
        socialLinks={{}}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Search platforms...'), {
      target: { value: 'nonexistent-platform' },
    });

    expect(screen.getByText('No platforms match your search')).toBeInTheDocument();
  });

  it('ignores selected ids that do not exist in socials dataset', () => {
    render(
      <SocialsSection
        selected={['missing-platform']}
        socialLinks={{}}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    expect(screen.getByText('Selected (1)')).toBeInTheDocument();

    expect(screen.queryByText('missing-platform')).not.toBeInTheDocument();
  });

  it('renders selected platform with empty link state indicator', () => {
    render(
      <SocialsSection
        selected={['github']}
        socialLinks={{}}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    expect(screen.getByText('Selected (1)')).toBeInTheDocument();

    expect(screen.getAllByText('GitHub').length).toBeGreaterThan(0);

    expect(screen.getByText('(no link)')).toBeInTheDocument();
  });
});
