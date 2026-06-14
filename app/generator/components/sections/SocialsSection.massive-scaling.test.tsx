import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SocialsSection } from './SocialsSection';

// Massive mock dataset simulating Extreme High Bounds
const MASSIVE_COUNT = 800;

// Mock the static dataset securely inside the hoisted factory
vi.mock('../../data/socials', () => {
  const MOCK_SOCIALS = Array.from({ length: 800 }).map((_, i) => ({
    id: `social-${i}`,
    name: `Platform ${i}`,
    category: i % 5 === 0 ? 'Dev' : 'Design',
    iconUrl: 'https://example.com/icon.png',
    placeholder: 'Enter url...',
    type: 'simpleicon',
  }));

  return {
    SOCIALS: MOCK_SOCIALS,
    SOCIAL_CATEGORIES: ['Dev', 'Design'],
  };
});

describe('SocialsSection Massive Data Sets and Extreme High Bounds Scaling', () => {
  const mockOnSelectedChange = vi.fn();
  const mockOnLinkChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. renders component with massive number of available platforms without crashing', () => {
    const startTime = performance.now();
    render(
      <SocialsSection
        selected={[]}
        socialLinks={{}}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );
    const renderTime = performance.now() - startTime;

    // Assert successful rendering of the entire monolithic structure
    expect(screen.getByText('Socials')).toBeInTheDocument();
    expect(screen.getByText(`${MASSIVE_COUNT} platforms`)).toBeInTheDocument();

    // Render time must safely stay under CI ceiling limits
    expect(renderTime).toBeLessThan(3000);
  });

  it('2. handles massive pre-selected arrays without performance degradation', () => {
    // Generate an enormous block of selected arrays
    const massiveSelected = Array.from({ length: 400 }).map((_, i) => `social-${i}`);

    render(
      <SocialsSection
        selected={massiveSelected}
        socialLinks={{}}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    // Verifies badge computes length correctly without array bounds exceptions
    expect(screen.getByText(`Selected (400)`)).toBeInTheDocument();
  });

  it('3. search filtering processes massive datasets efficiently', () => {
    render(
      <SocialsSection
        selected={[]}
        socialLinks={{}}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search platforms...');

    const startTime = performance.now();
    fireEvent.change(searchInput, { target: { value: 'Platform 777' } });
    const filterTime = performance.now() - startTime;

    // Checks precise filtration accuracy in heavy datasets
    expect(screen.getByText('Platform 777')).toBeInTheDocument();

    // Filtration parsing MUST finish securely fast
    expect(filterTime).toBeLessThan(1500);
  });

  it('4. category switching handles high volumes of platforms safely', () => {
    render(
      <SocialsSection
        selected={[]}
        socialLinks={{}}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    const devCategoryBtn = screen.getAllByText('Dev')[0];

    const startTime = performance.now();
    fireEvent.click(devCategoryBtn);
    const clickTime = performance.now() - startTime;

    // 800 total elements, every 5th is 'Dev', equating strictly to 160 elements
    expect(screen.getByText('160 platforms')).toBeInTheDocument();
    expect(clickTime).toBeLessThan(1500);
  });

  it('5. handles massive link record maps securely without buffer overflow', () => {
    // Inject massive dictionary payload mapping
    const massiveSelected = Array.from({ length: 200 }).map((_, i) => `social-${i}`);
    const massiveLinks: Record<string, string> = {};
    massiveSelected.forEach((id) => {
      massiveLinks[id] = `https://example.com/${id}`;
    });

    render(
      <SocialsSection
        selected={massiveSelected}
        socialLinks={massiveLinks}
        onSelectedChange={mockOnSelectedChange}
        onLinkChange={mockOnLinkChange}
      />
    );

    fireEvent.click(screen.getByText(`② Add Links (200)`));

    const firstInput = screen.getAllByDisplayValue('https://example.com/social-0')[0];
    expect(firstInput).toBeInTheDocument();

    // Simulate high-volume DOM mutation
    fireEvent.change(firstInput, { target: { value: 'https://new.com/social-0' } });
    expect(mockOnLinkChange).toHaveBeenCalledWith('social-0', 'https://new.com/social-0');
  });
});
