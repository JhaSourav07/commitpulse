import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import type { ComponentProps } from 'react';
import { SocialsSection } from './SocialsSection';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => <img src={src} alt={alt} width={width} height={height} className={className} />,
}));

vi.mock('../../data/socials', () => ({
  SOCIALS: [
    {
      id: 'github',
      name: 'GitHub',
      category: 'Developer',
      iconUrl: '/github.svg',
      type: 'simpleicon',
      siSlug: 'github',
      baseUrl: 'https://github.com/',
      placeholder: 'e.g. https://github.com/yourusername',
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      category: 'Social Media',
      iconUrl: '/twitter.svg',
      type: 'simpleicon',
      siSlug: 'x',
      baseUrl: 'https://x.com/',
      placeholder: 'e.g. https://x.com/yourhandle',
    },
  ],
  SOCIAL_CATEGORIES: ['Social Media', 'Developer'],
}));

const originalMatchMedia = window.matchMedia;
const originalInnerWidth = window.innerWidth;

function mockMatchMedia(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const minMatch = query.match(/\(min-width:\s*(\d+)px\)/);
      const maxMatch = query.match(/\(max-width:\s*(\d+)px\)/);
      let matches = false;
      if (minMatch) matches = width >= Number(minMatch[1]);
      else if (maxMatch) matches = width <= Number(maxMatch[1]);
      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: originalMatchMedia,
  });
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: originalInnerWidth,
  });
});

describe('SocialsSection - Responsive Breakpoints & Viewport Layouts', () => {
  it('Case 1: verifies grid and flex reflow structure under 375px mobile viewport', () => {
    mockMatchMedia(375);
    const props: ComponentProps<typeof SocialsSection> = {
      selected: ['github'],
      socialLinks: { github: 'https://github.com/test' },
      onSelectedChange: vi.fn(),
      onLinkChange: vi.fn(),
    };
    render(<SocialsSection {...props} />);

    const githubButton = screen.getByRole('button', { name: /GitHub/i });
    const gridContainer = githubButton.parentElement;
    expect(gridContainer).not.toBeNull();
    expect(gridContainer?.className).toContain('grid');
    expect(gridContainer?.className).toContain('grid-cols-1');

    const tabList = screen.getByRole('tablist');
    expect(tabList.className).toContain('flex');

    const categoryButtons = screen.getAllByRole('button', { name: /Social Media/i });
    const categoryButton = categoryButtons.find((btn) => !btn.className.includes('w-full'));
    expect(categoryButton).toBeDefined();
    const categoriesContainer = categoryButton!.parentElement;
    expect(categoriesContainer).not.toBeNull();
    expect(categoriesContainer?.className).toContain('flex');
    expect(categoriesContainer?.className).toContain('flex-wrap');
  });

  it('Case 2: ensures visual containers do not use fixed absolute pixel widths that cause horizontal scrolling', () => {
    mockMatchMedia(375);
    const props: ComponentProps<typeof SocialsSection> = {
      selected: ['github'],
      socialLinks: { github: 'https://github.com/test' },
      onSelectedChange: vi.fn(),
      onLinkChange: vi.fn(),
    };
    render(<SocialsSection {...props} />);

    const searchInput = screen.getByPlaceholderText('Search platforms...');
    expect(searchInput.className).toContain('w-full');
    expect(searchInput.className).not.toMatch(/w-\[\d+px\]/);

    const tabButtons = screen.getAllByRole('tab');
    tabButtons.forEach((tab) => {
      expect(tab.className).toContain('flex-1');
      expect(tab.className).not.toMatch(/w-\[\d+px\]/);
    });

    const sectionContainer = document.getElementById('socials-section');
    expect(sectionContainer).not.toBeNull();
    expect(sectionContainer?.className).not.toMatch(/w-\[\d+px\]/);

    const linksTab = screen.getByRole('tab', { name: /② add links/i });
    fireEvent.click(linksTab);

    const githubInput = screen.getByPlaceholderText('e.g. https://github.com/yourusername');
    expect(githubInput.className).toContain('w-full');
    expect(githubInput.className).not.toMatch(/w-\[\d+px\]/);
  });

  it('Case 3: verifies that categories scroll and interactive buttons maintain touch target space', () => {
    mockMatchMedia(375);
    const props: ComponentProps<typeof SocialsSection> = {
      selected: ['github'],
      socialLinks: { github: 'https://github.com/test' },
      onSelectedChange: vi.fn(),
      onLinkChange: vi.fn(),
    };
    render(<SocialsSection {...props} />);

    const categoryButtons = screen.getAllByRole('button', { name: /Social Media/i });
    const categoryButton = categoryButtons.find((btn) => !btn.className.includes('w-full'));
    expect(categoryButton).toBeDefined();
    const categoriesContainer = categoryButton!.parentElement;
    expect(categoriesContainer?.className).toContain('overflow-x-auto');

    const githubButton = screen.getByRole('button', { name: /GitHub/i });
    expect(githubButton.className).toContain('w-full');
    expect(githubButton.className).toContain('py-2.5');

    const searchInput = screen.getByPlaceholderText('Search platforms...');
    expect(searchInput.className).toContain('py-2.5');

    const tabButtons = screen.getAllByRole('tab');
    tabButtons.forEach((tab) => {
      expect(tab.className).toContain('py-1.5');
    });
  });

  it('Case 4: confirms mobile visibility states and toggle interactions respond smoothly without exceptions', () => {
    mockMatchMedia(375);
    const onSelectedChange = vi.fn();
    const props: ComponentProps<typeof SocialsSection> = {
      selected: ['github'],
      socialLinks: { github: 'https://github.com/test' },
      onSelectedChange,
      onLinkChange: vi.fn(),
    };
    render(<SocialsSection {...props} />);

    expect(screen.getByPlaceholderText('Search platforms...')).toBeVisible();

    const twitterButton = screen.getByRole('button', { name: /X \(Twitter\)/i });
    fireEvent.click(twitterButton);
    expect(onSelectedChange).toHaveBeenCalledWith(['github', 'twitter']);

    const linksTab = screen.getByRole('tab', { name: /② add links/i });
    fireEvent.click(linksTab);

    expect(screen.queryByPlaceholderText('Search platforms...')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. https://github.com/yourusername')).toBeVisible();
  });

  it('Case 5: verifies resizing the viewport across responsive boundaries preserves structural states and tabs correctly', () => {
    mockMatchMedia(375);
    const props: ComponentProps<typeof SocialsSection> = {
      selected: ['github'],
      socialLinks: { github: 'https://github.com/test' },
      onSelectedChange: vi.fn(),
      onLinkChange: vi.fn(),
    };
    const { rerender } = render(<SocialsSection {...props} />);

    const linksTab = screen.getByRole('tab', { name: /② add links/i });
    fireEvent.click(linksTab);

    expect(linksTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByPlaceholderText('e.g. https://github.com/yourusername')).toBeVisible();

    mockMatchMedia(1024);
    window.dispatchEvent(new Event('resize'));

    rerender(<SocialsSection {...props} />);

    const updatedLinksTab = screen.getByRole('tab', { name: /② add links/i });
    expect(updatedLinksTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByPlaceholderText('e.g. https://github.com/yourusername')).toBeVisible();

    const pickTab = screen.getByRole('tab', { name: /① pick platforms/i });
    fireEvent.click(pickTab);
    expect(pickTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByPlaceholderText('Search platforms...')).toBeVisible();
  });
});
