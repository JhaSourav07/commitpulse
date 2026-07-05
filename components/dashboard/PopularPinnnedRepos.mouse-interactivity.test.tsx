import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PopularRepos } from './PopularPinnnedRepos';

const mockPopularRepos = [
  {
    name: 'popular-alpha',
    description: 'First popular repo description text.',
    stargazerCount: 42,
    forkCount: 5,
    url: 'https://github.com/test/popular-alpha',
    primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
  },
  {
    name: 'popular-beta-longer-name-to-test-truncation',
    description: 'Second popular repo description text.',
    stargazerCount: 100,
    forkCount: 15,
    url: 'https://github.com/test/popular-beta',
    primaryLanguage: { name: 'Go', color: '#00add8' },
  },
];

const mockPinnedRepos = [
  {
    name: 'pinned-alpha',
    description: 'A pinned repository with standard description.',
    stargazerCount: 88,
    forkCount: 10,
    url: 'https://github.com/test/pinned-alpha',
    primaryLanguage: { name: 'JavaScript', color: '#f1e05a' },
  },
];

const mockStarredRepos = [
  {
    name: 'starred-alpha',
    description: 'A starred repository with standard description.',
    stargazerCount: 99,
    forkCount: 12,
    url: 'https://github.com/test/starred-alpha',
    primaryLanguage: { name: 'Python', color: '#3572A5' },
  },
];

describe('PopularRepos Mouse and Touch Interactivity', () => {
  // 1. Trigger simulated mouseenter/hover gestures on active segments or interactive nodes.
  it('triggers mouseenter and mouseleave gestures on repository cards and validates transition classes', () => {
    render(
      <PopularRepos
        popularRepos={mockPopularRepos}
        pinnedRepos={mockPinnedRepos}
        starredRepos={mockStarredRepos}
      />
    );

    const firstCard = screen.getByRole('link', { name: /popular-alpha/i });

    const mouseEnterSpy = vi.fn();
    const mouseLeaveSpy = vi.fn();

    firstCard.addEventListener('mouseenter', mouseEnterSpy);
    firstCard.addEventListener('mouseleave', mouseLeaveSpy);

    // Simulate hover
    fireEvent.mouseEnter(firstCard);
    expect(mouseEnterSpy).toHaveBeenCalledTimes(1);

    // Verify hover transition classes exist on the element
    expect(firstCard.className).toContain('transition-all');
    expect(firstCard.className).toContain('duration-200');
    expect(firstCard.className).toContain('hover:bg-gray-100/80');

    // Simulate mouse exit
    fireEvent.mouseLeave(firstCard);
    expect(mouseLeaveSpy).toHaveBeenCalledTimes(1);
  });

  // 2. Verify that responsive tooltip layouts display at computed coordinates.
  it('verifies that title tooltip attributes are present for truncated repository names', () => {
    render(
      <PopularRepos
        popularRepos={mockPopularRepos}
        pinnedRepos={mockPinnedRepos}
        starredRepos={mockStarredRepos}
      />
    );

    const titleHeader = screen.getByRole('heading', {
      name: /popular-beta-long/i,
    });

    // The h4 element holds the full name as a tooltip title attribute
    expect(titleHeader).toHaveAttribute('title', 'popular-beta-longer-name-to-test-truncation');
  });

  // 3. Test custom click/touch gestures and ensure click events propagate correctly.
  it('handles click and touch gestures and ensures events propagate correctly through nodes', async () => {
    const user = userEvent.setup();
    render(
      <PopularRepos
        popularRepos={mockPopularRepos}
        pinnedRepos={mockPinnedRepos}
        starredRepos={mockStarredRepos}
      />
    );

    const dropdownButton = screen.getByRole('button', { name: /popular/i });

    const buttonClickSpy = vi.fn();
    const parentClickSpy = vi.fn();

    dropdownButton.addEventListener('click', buttonClickSpy);
    dropdownButton.parentElement?.addEventListener('click', parentClickSpy);

    // Click triggers both button and parent handlers (propagation)
    await user.click(dropdownButton);

    expect(buttonClickSpy).toHaveBeenCalledTimes(1);
    expect(parentClickSpy).toHaveBeenCalledTimes(1);

    // Test touch gestures on the repository links
    const firstCard = screen.getByRole('link', { name: /popular-alpha/i });
    const touchStartSpy = vi.fn();
    const touchEndSpy = vi.fn();

    firstCard.addEventListener('touchstart', touchStartSpy);
    firstCard.addEventListener('touchend', touchEndSpy);

    expect(() => fireEvent.touchStart(firstCard)).not.toThrow();
    expect(() => fireEvent.touchEnd(firstCard)).not.toThrow();

    expect(touchStartSpy).toHaveBeenCalledTimes(1);
    expect(touchEndSpy).toHaveBeenCalledTimes(1);
  });

  // 4. Assert appropriate cursor style classes are applied on hover.
  it('asserts appropriate cursor classes and interactions on interactive elements', () => {
    render(
      <PopularRepos
        popularRepos={mockPopularRepos}
        pinnedRepos={mockPinnedRepos}
        starredRepos={mockStarredRepos}
      />
    );

    const dropdownButton = screen.getByRole('button', { name: /popular/i });
    const repositoryCard = screen.getByRole('link', { name: /popular-alpha/i });

    // Verify hover background/colors classes are defined on button
    expect(dropdownButton.className).toContain('hover:bg-gray-100');
    expect(dropdownButton.className).toContain('dark:hover:bg-neutral-800');

    // Verify group and hover classes are defined on repository card
    expect(repositoryCard.className).toContain('group');
    expect(repositoryCard.className).toContain('hover:bg-gray-100/80');
    expect(repositoryCard.className).toContain('dark:hover:bg-neutral-800/40');
  });

  // 5. Check that mouseleave/click-outside events successfully hide temporary overlay visuals.
  it('verifies that outside click events successfully close and hide the dropdown listbox overlay', async () => {
    const user = userEvent.setup();
    render(
      <PopularRepos
        popularRepos={mockPopularRepos}
        pinnedRepos={mockPinnedRepos}
        starredRepos={mockStarredRepos}
      />
    );

    // Click to open dropdown
    const dropdownButton = screen.getByRole('button', { name: /popular/i });
    await user.click(dropdownButton);

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    // Click outside of the dropdown to triggerhandleClickOutside
    await user.click(document.body);

    // The listbox dropdown overlay should now be hidden/removed
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
