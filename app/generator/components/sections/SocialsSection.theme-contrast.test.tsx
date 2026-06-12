import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SocialsSection } from './SocialsSection';
import React from 'react';

// Mock the socials data to maintain isolated coverage
vi.mock('../../data/socials', () => ({
  SOCIALS: [
    {
      id: 'github',
      name: 'GitHub',
      type: 'simpleicon',
      iconUrl: '/github.svg',
      category: 'Development',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      type: 'simpleicon',
      iconUrl: '/twitter.svg',
      category: 'Social',
    },
  ],
  SOCIAL_CATEGORIES: ['Development', 'Social'],
}));

describe('SocialsSection Theme Contrast & Visual Cohesion', () => {
  const defaultProps = {
    selected: ['github'],
    socialLinks: { github: 'https://github.com/test' },
    onSelectedChange: vi.fn(),
    onLinkChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.className = '';
  });

  afterEach(() => {
    document.documentElement.className = '';
  });

  it('renders correctly in light theme with proper structure', () => {
    document.documentElement.className = 'light';
    render(<SocialsSection {...defaultProps} />);

    expect(screen.getByText('Socials')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search platforms...')).toBeInTheDocument();
    expect(screen.getByText(/Pick Platforms/i)).toBeInTheDocument();
  });

  it('renders correctly in dark theme with proper structure', () => {
    document.documentElement.className = 'dark';
    render(<SocialsSection {...defaultProps} />);

    expect(screen.getByText('Socials')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search platforms...')).toBeInTheDocument();
    expect(screen.getByText(/Pick Platforms/i)).toBeInTheDocument();
  });

  it('ensures text remains visible in light mode (contrast proxy check)', () => {
    document.documentElement.className = 'light';
    render(<SocialsSection {...defaultProps} />);

    // Primary text elements should remain fully visible in light mode
    expect(screen.getAllByText('GitHub')[0]).toBeVisible();
    expect(screen.getAllByText('Twitter')[0]).toBeVisible();
    expect(screen.getAllByText(/Pick Platforms/i)[0]).toBeVisible();
  });

  it('ensures text remains visible in dark mode (contrast proxy check)', () => {
    document.documentElement.className = 'dark';
    render(<SocialsSection {...defaultProps} />);

    // Primary text elements should remain fully visible in dark mode
    expect(screen.getAllByText('GitHub')[0]).toBeVisible();
    expect(screen.getAllByText('Twitter')[0]).toBeVisible();
    expect(screen.getAllByText(/Pick Platforms/i)[0]).toBeVisible();
  });

  it('maintains UI stability and renders links tab correctly in dark mode', () => {
    document.documentElement.className = 'dark';
    render(<SocialsSection {...defaultProps} />);

    // Switch active tabs to ensure components render correctly in dark mode
    const linksTab = screen.getByText('② Add Links (1)');
    fireEvent.click(linksTab);

    expect(screen.getByDisplayValue('https://github.com/test')).toBeInTheDocument();
  });
});
