import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { PopularRepos } from './PopularPinnnedRepos';

const generateMassiveRepoList = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    name: `massive-repo-scale-item-${i}`,
    description:
      `Automated testing string boundary simulation text content wrapper item index sequence ${i}. `.repeat(
        2
      ),
    stargazerCount: 150000 + i,
    forkCount: 45000 + i,
    url: `https://github.com/scale-test/repo-${i}`,
    primaryLanguage: {
      name: i % 2 === 0 ? 'TypeScript' : 'Go',
      color: i % 2 === 0 ? '#3178c6' : '#00add8',
    },
  }));
};

describe('PopularRepos - Massive Data Scaling', () => {
  test('should clamp and render only the top 3 cards when passed thousands of repositories', () => {
    const massiveDataset = generateMassiveRepoList(5000);

    const { container } = render(<PopularRepos popularRepos={massiveDataset} />);

    // Verifies activeRepos.slice(0, 3) boundary constraint holds under load
    const renderedCards = container.querySelectorAll("a[href^='https://github.com']");
    expect(renderedCards).toHaveLength(3);
  });

  test('should handle astronomical metrics values without layout breaks', () => {
    const extremeBoundRepo = [
      {
        name: 'infinite-stars-overflow-breakout-test-suite',
        description: 'Testing string allocation buffers.',
        stargazerCount: 999999999999,
        forkCount: 888888888888,
        url: 'https://github.com/scale-test/bounds',
        primaryLanguage: { name: 'Rust', color: '#dea584' },
      },
    ];

    const { container } = render(<PopularRepos popularRepos={extremeBoundRepo} />);

    expect(container.innerHTML).toContain('999999999999');
  });

  test('should safely process extreme text lengths and apply responsive wrapping utilities', () => {
    const extremeTextRepo = [
      {
        name: 'A'.repeat(500),
        description: 'B'.repeat(5000),
        stargazerCount: 42,
        forkCount: 7,
        url: 'https://github.com/scale-test/text-overflow',
        primaryLanguage: { name: 'CSS', color: '#563d7c' },
      },
    ];

    const { container } = render(<PopularRepos popularRepos={extremeTextRepo} />);

    const titleHeader = container.querySelector('h4');
    const descParagraph = container.querySelector('p');

    // Optimized length verification to avoid giant buffer string comparisons
    expect(descParagraph?.textContent?.length).toBe(5000);

    // Verify layout tree preservation styling classes (truncate for titles, line-clamp for descriptions) exist
    expect(titleHeader?.className).toContain('truncate');
    expect(descParagraph?.className).toContain('line-clamp-2');
  });

  test('should evaluate empty states safely across mass iterations without appending DOM elements', () => {
    const cleanInstances = 1000;

    const { container } = render(
      <div>
        {Array.from({ length: cleanInstances }).map((_, i) => (
          <PopularRepos key={i} popularRepos={[]} pinnedRepos={[]} starredRepos={[]} />
        ))}
      </div>
    );

    // Inner wrapper node count must be precisely 0
    expect(container.firstChild?.childNodes).toHaveLength(0);
  });

  test('should maintain toggle panel properties when nested within layout structures', () => {
    const activeMock = generateMassiveRepoList(5);

    const { container } = render(
      <div className="view-grid-wrapper">
        <section className="nested-dashboard-flex">
          <PopularRepos
            popularRepos={activeMock}
            pinnedRepos={activeMock}
            starredRepos={activeMock}
          />
        </section>
      </div>
    );

    const innerPanel = container.querySelector('.nested-dashboard-flex');
    expect(innerPanel).not.toBeNull();

    // Dropdown activation triggers conditionally only if availableViews.length > 1
    const dropDownButton = innerPanel?.querySelector("button[aria-haspopup='listbox']");
    expect(dropDownButton).not.toBeNull();
  });
});
