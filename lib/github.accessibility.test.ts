import { describe, it, expect, beforeEach, afterEach } from 'vitest';

interface MockRepo {
  name: string;
  description: string;
  stars: number;
}

interface MockContributions {
  date: string;
  count: number;
}

const mockRepos: MockRepo[] = [
  {
    name: 'commitpulse',
    description: 'Sleek developer statistics dashboard',
    stars: 124,
  },
  {
    name: 'github-streak-badge',
    description: 'Highly configurable streak badge generator',
    stars: 48,
  },
];

const mockContribs: MockContributions[] = [
  { date: '2026-06-01', count: 5 },
  { date: '2026-06-02', count: 0 },
  { date: '2026-06-03', count: 12 },
];

function createGitHubUI(repos: MockRepo[], contributions: MockContributions[]): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'github-accessibility-widget';

  // H1 title
  const title = document.createElement('h1');
  title.id = 'widget-title';
  title.textContent = 'GitHub Profile & Activity';
  container.appendChild(title);

  // Section 1: Repositories (H2)
  const reposSection = document.createElement('section');
  reposSection.setAttribute('aria-labelledby', 'repos-heading');

  const reposHeading = document.createElement('h2');
  reposHeading.id = 'repos-heading';
  reposHeading.textContent = 'Popular Repositories';
  reposSection.appendChild(reposHeading);

  const reposList = document.createElement('ul');
  reposList.setAttribute('role', 'list');

  repos.forEach((repo, index) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'listitem');

    // H3 for each repository
    const repoTitle = document.createElement('h3');
    repoTitle.textContent = repo.name;
    item.appendChild(repoTitle);

    const card = document.createElement('div');
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', `Repository details for ${repo.name}`);

    // Focusable Details Button
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'details-btn';
    detailsBtn.id = `details-btn-${index}`;
    detailsBtn.textContent = 'View Details';
    detailsBtn.setAttribute('aria-label', `View details for ${repo.name}`);
    detailsBtn.style.outline = 'none';

    detailsBtn.addEventListener('focus', () => {
      detailsBtn.style.outline = '3px solid blue';
    });
    detailsBtn.addEventListener('blur', () => {
      detailsBtn.style.outline = 'none';
    });

    // Tooltip for stars using aria-describedby
    const tooltipId = `tooltip-stars-${index}`;
    const starsIcon = document.createElement('span');
    starsIcon.setAttribute('role', 'img');
    starsIcon.setAttribute('aria-label', `${repo.stars} stars`);
    starsIcon.setAttribute('tabindex', '0');
    starsIcon.setAttribute('aria-describedby', tooltipId);
    starsIcon.className = 'stars-icon';
    starsIcon.id = `stars-icon-${index}`;
    starsIcon.style.outline = 'none';

    starsIcon.addEventListener('focus', () => {
      starsIcon.style.outline = '3px dotted green';
    });
    starsIcon.addEventListener('blur', () => {
      starsIcon.style.outline = 'none';
    });

    const tooltip = document.createElement('div');
    tooltip.id = tooltipId;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = `Repository has ${repo.stars} stars on GitHub`;

    card.appendChild(detailsBtn);
    card.appendChild(starsIcon);
    card.appendChild(tooltip);
    item.appendChild(card);
    reposList.appendChild(item);
  });

  reposSection.appendChild(reposList);
  container.appendChild(reposSection);

  // Section 2: Contributions (H2)
  const contribSection = document.createElement('section');
  contribSection.setAttribute('aria-labelledby', 'contrib-heading');

  const contribHeading = document.createElement('h2');
  contribHeading.id = 'contrib-heading';
  contribHeading.textContent = 'Contribution Calendar';
  contribSection.appendChild(contribHeading);

  const grid = document.createElement('div');
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', 'GitHub contributions grid');

  const row = document.createElement('div');
  row.setAttribute('role', 'row');

  contributions.forEach((c, index) => {
    const cell = document.createElement('div');
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label', `${c.count} contributions on ${c.date}`);
    cell.className = 'contrib-cell';
    cell.id = `contrib-cell-${index}`;
    cell.style.outline = 'none';

    cell.addEventListener('focus', () => {
      cell.style.outline = '2px solid orange';
    });
    cell.addEventListener('blur', () => {
      cell.style.outline = 'none';
    });

    row.appendChild(cell);
  });

  grid.appendChild(row);
  contribSection.appendChild(grid);
  container.appendChild(contribSection);

  return container;
}

describe('GitHub Accessibility Standards & Screen Reader Aria Compliance', () => {
  let rootContainer: HTMLDivElement;

  beforeEach(() => {
    rootContainer = createGitHubUI(mockRepos, mockContribs);
    document.body.appendChild(rootContainer);
  });

  afterEach(() => {
    if (rootContainer) {
      document.body.removeChild(rootContainer);
    }
  });

  // Test Case 1: Inspect markup to check for correct use of accessible label coordinates
  it('Verify markup contains correct roles and linking coordinate attributes', () => {
    const sections = rootContainer.querySelectorAll('section');
    expect(sections.length).toBe(2);

    sections.forEach((sec) => {
      const labelId = sec.getAttribute('aria-labelledby');
      expect(labelId).not.toBeNull();
      const heading = rootContainer.querySelector(`#${labelId}`);
      expect(heading).not.toBeNull();
    });

    const list = rootContainer.querySelector('[role="list"]');
    expect(list).toBeInTheDocument();

    const listitems = rootContainer.querySelectorAll('[role="listitem"]');
    expect(listitems.length).toBe(mockRepos.length);

    const regions = rootContainer.querySelectorAll('[role="region"]');
    expect(regions.length).toBe(mockRepos.length);
    regions.forEach((reg, index) => {
      expect(reg.getAttribute('aria-label')).toBe(
        `Repository details for ${mockRepos[index].name}`
      );
    });
  });

  // Test Case 2: Assert elements that accept key focus maintain visible outline behaviors
  it('Verify key focusable elements change and maintain outline styles upon interaction', () => {
    const firstBtn = document.getElementById('details-btn-0') as HTMLButtonElement;
    expect(firstBtn).toBeInTheDocument();
    expect(firstBtn.style.outline).toBe('none');

    firstBtn.focus();
    expect(firstBtn).toHaveFocus();
    expect(firstBtn.style.outline).toBe('3px solid blue');

    firstBtn.blur();
    expect(firstBtn).not.toHaveFocus();
    expect(firstBtn.style.outline).toBe('none');

    const firstIcon = document.getElementById('stars-icon-0') as HTMLSpanElement;
    expect(firstIcon).toBeInTheDocument();
    expect(firstIcon.style.outline).toBe('none');

    firstIcon.focus();
    expect(firstIcon).toHaveFocus();
    expect(firstIcon.style.outline).toBe('3px dotted green');

    firstIcon.blur();
    expect(firstIcon).not.toHaveFocus();
    expect(firstIcon.style.outline).toBe('none');
  });

  // Test Case 3: Verify tooltip labels are announced with correct accessibility descriptions
  it('Verify tooltips are correctly linked to source nodes via aria-describedby', () => {
    mockRepos.forEach((_, index) => {
      const icon = document.getElementById(`stars-icon-${index}`);
      expect(icon).toBeInTheDocument();

      const tooltipId = icon?.getAttribute('aria-describedby');
      expect(tooltipId).not.toBeNull();

      const tooltip = document.getElementById(tooltipId!);
      expect(tooltip).toBeInTheDocument();
      expect(tooltip?.getAttribute('role')).toBe('tooltip');
      expect(tooltip?.textContent).toContain(`Repository has ${mockRepos[index].stars} stars`);
    });
  });

  // Test Case 4: Test keyboard control path selectors to ensure normal tab ordering
  it('Verify tab indices are structured sequentially to allow visual tab-ordering', () => {
    const focusableElements = [
      document.getElementById('details-btn-0'),
      document.getElementById('stars-icon-0'),
      document.getElementById('details-btn-1'),
      document.getElementById('stars-icon-1'),
      document.getElementById('contrib-cell-0'),
      document.getElementById('contrib-cell-1'),
      document.getElementById('contrib-cell-2'),
    ];

    focusableElements.forEach((el) => {
      expect(el).not.toBeNull();
      (el as HTMLElement).focus();
      expect(document.activeElement).toBe(el);
    });
  });

  // Test Case 5: Confirm standard headings exist in the correct logical hierarchical order
  it('Verify headings are nested correctly in standard hierarchical structure', () => {
    const h1 = rootContainer.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1?.id).toBe('widget-title');

    const h2s = rootContainer.querySelectorAll('h2');
    expect(h2s.length).toBe(2);

    const h3s = rootContainer.querySelectorAll('h3');
    expect(h3s.length).toBe(mockRepos.length);

    const headingElements = rootContainer.querySelectorAll('h1, h2, h3');
    const tags = Array.from(headingElements).map((el) => el.tagName.toLowerCase());

    expect(tags[0]).toBe('h1');
    expect(tags).toContain('h2');
    expect(tags).toContain('h3');

    // Verify logical nesting order (h2 appears before h3)
    const firstH2 = tags.indexOf('h2');
    const firstH3 = tags.indexOf('h3');
    expect(firstH2).toBeLessThan(firstH3);
  });
});
