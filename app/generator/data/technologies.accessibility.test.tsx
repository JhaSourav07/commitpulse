import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

import { TechnologiesSection } from '../components/sections/TechnologiesSection';

// Mock technologies data
vi.mock('./technologies', () => ({
  TECHNOLOGIES: [
    {
      id: 'react',
      name: 'React',
      category: 'Frontend',
      iconUrl: '/react.svg',
      type: 'devicon',
    },
    {
      id: 'typescript',
      name: 'TypeScript',
      category: 'Languages',
      iconUrl: '/typescript.svg',
      type: 'devicon',
    },
  ],
  TECH_CATEGORIES: ['Frontend', 'Languages'],
}));

// Mock recommendation engine
vi.mock('@/lib/graph/recommendationEngine', () => ({
  getRecommendations: () => [],
}));

// Mock TechnologyGraph
vi.mock('../components/sections/TechnologyGraph', () => ({
  TechnologyGraph: () => <div data-testid="technology-graph" />,
}));

describe('TechnologiesSection Accessibility Standards & Screen Reader Compliance', () => {
  const defaultProps = {
    selected: ['react'],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Case 1
  it('Case 1: search field remains keyboard accessible', () => {
    render(<TechnologiesSection {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search technologies...');

    searchInput.focus();

    expect(searchInput).toHaveFocus();
  });

  // Case 2
  it('Case 2: exposes category filters as accessible buttons', () => {
    render(<TechnologiesSection {...defaultProps} />);

    expect(
      screen.getByRole('button', {
        name: 'Frontend',
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Languages',
      })
    ).toBeInTheDocument();
  });

  // Case 3
  it('Case 3: technology selectors expose readable accessible names', () => {
    render(<TechnologiesSection {...defaultProps} />);

    expect(
      screen.getByRole('button', {
        name: /react/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /typescript/i,
      })
    ).toBeInTheDocument();
  });

  // Case 4
  it('Case 4: technology icons provide accessible alternative text', () => {
    render(<TechnologiesSection {...defaultProps} />);

    expect(screen.getByAltText('React')).toBeInTheDocument();
    expect(screen.getByAltText('TypeScript')).toBeInTheDocument();
  });

  // Case 5
  it('Case 5: clear search control remains keyboard accessible', () => {
    render(<TechnologiesSection {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search technologies...');

    fireEvent.change(searchInput, {
      target: { value: 'react' },
    });

    const clearButton = screen.getAllByRole('button')[0];

    clearButton.focus();

    expect(clearButton).toHaveFocus();
  });
});
