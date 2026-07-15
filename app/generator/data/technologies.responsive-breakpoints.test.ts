import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TechnologiesSection } from '../components/sections/TechnologiesSection';
import { TECHNOLOGIES, TECH_CATEGORIES, getTechById } from './technologies';

vi.mock('lucide-react', () => ({
  ChevronDown: (props: Record<string, unknown>) =>
    React.createElement('svg', { 'data-testid': 'chevron-down-icon', ...props }),
  Search: (props: Record<string, unknown>) =>
    React.createElement('svg', { 'data-testid': 'search-icon', ...props }),
  X: (props: Record<string, unknown>) =>
    React.createElement('svg', { 'data-testid': 'x-icon', ...props }),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => React.createElement('img', props),
}));

const MOBILE_VIEWPORT = {
  width: 375,
  height: 667,
};

type Viewport = typeof MOBILE_VIEWPORT;

const setViewport = ({ width, height }: Viewport) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const maxWidth = query.match(/\(max-width:\s*(\d+)px\)/);
      const minWidth = query.match(/\(min-width:\s*(\d+)px\)/);

      return {
        matches:
          (!maxWidth || width <= Number(maxWidth[1])) &&
          (!minWidth || width >= Number(minWidth[1])),
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
};

describe('technologies - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setViewport(MOBILE_VIEWPORT);
  });

  afterEach(() => {
    cleanup();
  });

  const renderTechnologiesSection = (selected: string[] = [], onChange = vi.fn()) => {
    render(React.createElement(TechnologiesSection, { selected, onChange }));

    return {
      onChange,
      section: document.querySelector('#technologies-section') as HTMLElement,
    };
  };

  const getTechnologyButton = (id: string) => {
    const technology = getTechById(id);
    expect(technology).toBeDefined();

    const button = screen.getAllByRole('button').find((button) => {
      const normalizedText = (button.textContent ?? '').replace(/\s/g, '');
      const expectedText = `${technology?.name}${technology?.category}`.replace(/\s/g, '');

      return button.className.includes('w-full') && normalizedText === expectedText;
    });

    expect(button).toBeDefined();
    return button!;
  };

  const getTechnologyButtons = () =>
    screen
      .getAllByRole('button')
      .filter(
        (button) =>
          button.className.includes('w-full') &&
          button.className.includes('px-3') &&
          button.className.includes('rounded-xl')
      );

  it('renders the real technology catalog under standard 375px mobile coordinates', () => {
    const { section } = renderTechnologiesSection();

    expect(window.innerWidth).toBe(375);
    expect(window.innerHeight).toBe(667);
    expect(window.matchMedia('(max-width: 640px)').matches).toBe(true);
    expect(section).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`^${TECHNOLOGIES.length}\\s+technologies$`))
    ).toBeInTheDocument();
    expect(getTechnologyButton('javascript')).toBeInTheDocument();
  });

  it('renders technology columns as the real one-column vertical mobile list', () => {
    const { section } = renderTechnologiesSection();
    const list = section.querySelector('.grid.grid-cols-1.gap-1.max-h-72');

    expect(list).toBeInTheDocument();
    expect(list).toHaveClass('grid', 'grid-cols-1', 'gap-1', 'overflow-y-auto');
    expect(
      within(list as HTMLElement)
        .getByText('JavaScript')
        .closest('button')
    ).toHaveClass('flex', 'items-center', 'w-full', 'text-left');
  });

  it('uses fluid real row and input classes instead of absolute widths that cause mobile overflow', () => {
    renderTechnologiesSection();

    const searchInput = screen.getByPlaceholderText('Search technologies...');
    const technologyButtons = getTechnologyButtons();
    const combinedClasses = [
      searchInput.className,
      ...technologyButtons.map((button) => button.className),
    ].join(' ');

    expect(searchInput).toHaveClass('w-full');
    expect(technologyButtons.length).toBe(TECHNOLOGIES.length);
    technologyButtons.forEach((button) => {
      expect(button).toHaveClass('w-full');
      expect(button.getAttribute('style')).toBeNull();
    });
    expect(combinedClasses).not.toMatch(/\bw-screen\b/);
    expect(combinedClasses).not.toMatch(/\bmin-w-screen\b/);
    expect(combinedClasses).not.toMatch(/\bw-\[\d+(px|rem|vw)\]/);
  });

  it('renders real category navigation as wrapping compact mobile controls', () => {
    const { section } = renderTechnologiesSection();
    const categoryNav = section.querySelector('.flex.flex-wrap.gap-1\\.5.mb-4');
    const categoryButtons = ['All', ...TECH_CATEGORIES].map((category) =>
      screen.getByRole('button', { name: category })
    );

    expect(categoryNav).toBeInTheDocument();
    expect(categoryNav).toHaveClass('flex', 'flex-wrap', 'overflow-x-auto');
    expect(categoryButtons).toHaveLength(TECH_CATEGORIES.length + 1);
    categoryButtons.forEach((button) => {
      expect(button).toHaveClass('px-2.5', 'py-1', 'text-[11px]', 'whitespace-nowrap');
    });
  });

  it('responds to real mobile technology toggle states with valid catalog IDs', () => {
    const { onChange } = renderTechnologiesSection();
    const reactButton = getTechnologyButton('react');

    fireEvent.click(reactButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['react']);

    cleanup();
    renderTechnologiesSection(['react']);

    expect(screen.getByText('Selected (1)')).toBeInTheDocument();
    expect(screen.getByText('Clear all')).toBeInTheDocument();
    expect(getTechnologyButton('react')).toHaveClass(
      'bg-emerald-500/15',
      'border',
      'text-emerald-700'
    );
  });
});
