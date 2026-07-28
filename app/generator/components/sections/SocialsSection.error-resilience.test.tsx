import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SocialsSection } from './SocialsSection';

// 1. Next.js Image mock using standard React Image HTML Attribute typings instead of 'any'
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// 2. Mock SectionCard cleanly
vi.mock('../SectionCard', () => ({
  SectionCard: ({
    title,
    children,
    badge,
  }: {
    title: string;
    children: React.ReactNode;
    badge?: number;
  }) => (
    <div data-testid="section-card">
      <h2>{title}</h2>
      {badge !== undefined && <span data-testid="card-badge">{badge}</span>}
      {children}
    </div>
  ),
  FieldLabel: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="field-label">{children}</span>
  ),
}));

// 3. Mock the social data with format-valid static items
vi.mock('../../data/socials', () => ({
  SOCIAL_CATEGORIES: ['Social Media', 'Developer', 'Contact'],
  SOCIALS: [
    {
      id: 'github',
      name: 'GitHub',
      category: 'Developer',
      iconUrl: '/icons/github.svg',
      type: 'simpleicon',
      baseUrl: 'https://github.com/',
      placeholder: 'username',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      category: 'Social Media',
      iconUrl: '/icons/twitter.svg',
      type: 'simpleicon',
      baseUrl: 'https://twitter.com/',
      placeholder: 'username',
    },
    {
      id: 'email',
      name: 'Email',
      category: 'Contact',
      iconUrl: '/icons/email.svg',
      type: 'simpleicon',
      baseUrl: 'mailto:',
      placeholder: 'developer@example.com',
    },
  ],
}));

describe('SocialsSection - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  const mockOnSelectedChange = vi.fn();
  const mockOnLinkChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('recovers gracefully and defaults to safe values when selected items array is undefined', () => {
    render(
      <SocialsSection
        selected={undefined as unknown as string[]} // Resolves no-explicit-any cleanly
        socialLinks={null as unknown as Record<string, string>}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    expect(screen.getByText('① Pick Platforms')).toBeInTheDocument();
    expect(screen.getByTestId('card-badge')).toHaveTextContent('0');
    expect(screen.getByText('3 platforms')).toBeInTheDocument();
  });

  it('prevents rendering crashes if selected contains platform IDs not present in static database', () => {
    render(
      <SocialsSection
        selected={['non-existent-platform-id']}
        socialLinks={{ 'non-existent-platform-id': 'test-link' }}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    expect(screen.getByTestId('card-badge')).toHaveTextContent('1');
    expect(screen.queryByText('non-existent-platform-id')).not.toBeInTheDocument();
  });

  it('renders clear warning elements when entering the link panel without selecting platforms', () => {
    render(
      <SocialsSection
        selected={[]}
        socialLinks={{}}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    const linkTabButton = screen.getByRole('tab', { name: /Add Links/i });
    fireEvent.click(linkTabButton);

    expect(screen.getByText('No platforms selected yet')).toBeInTheDocument();
    const pickButton = screen.getByRole('button', { name: /Pick platforms first/i });
    expect(pickButton).toBeInTheDocument();

    fireEvent.click(pickButton);
    expect(screen.getByText('① Pick Platforms')).toBeInTheDocument();
  });

  it('safely normalizes input strings to prevent duplicate protocol rendering on email links', () => {
    render(
      <SocialsSection
        selected={['email']}
        socialLinks={{ email: 'mailto:developer@example.com' }}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    const linkTabButton = screen.getByRole('tab', { name: /Add Links/i });
    fireEvent.click(linkTabButton);

    const previewLink = screen.getByRole('link');
    expect(previewLink).toHaveAttribute('href', 'mailto:developer@example.com');
  });

  it('registers reset triggers safely and fires selection flush functions upon invocation', () => {
    render(
      <SocialsSection
        selected={['github', 'twitter']}
        socialLinks={{}}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    const clearAllButton = screen.getByRole('button', { name: /Clear all/i });
    expect(clearAllButton).toBeInTheDocument();

    fireEvent.click(clearAllButton);
    expect(mockOnSelectedChange).toHaveBeenCalledWith([]);
  });
});
