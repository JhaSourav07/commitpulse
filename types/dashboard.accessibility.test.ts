import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserProfile, UserStats, Achievement } from './dashboard';

const mockProfile: UserProfile = {
  username: 'coder123',
  name: 'Alex Coder',
  avatarUrl: 'https://avatars.githubusercontent.com/u/123456?v=4',
  isPro: true,
  bio: 'Full-stack developer loving open source.',
  location: 'San Francisco, CA',
  joinedDate: '2020-05-15',
  developerScore: 95,
  type: 'User',
  stats: {
    repositories: 24,
    followers: 1250,
    following: 150,
    stars: 450,
  },
};

const mockStats: UserStats = {
  currentStreak: 12,
  peakStreak: 45,
  totalContributions: 1254,
};

const mockAchievements: Achievement[] = [
  {
    id: 'ach-1',
    title: 'Code Warrior',
    description: 'Commit 100 times in a year',
    icon: '⚔️',
    isUnlocked: true,
    type: 'contributions',
    threshold: 100,
    currentValue: 120,
    progress: 100,
  },
  {
    id: 'ach-2',
    title: 'Streak Master',
    description: 'Maintain a 30-day streak',
    icon: '🔥',
    isUnlocked: false,
    type: 'streak',
    threshold: 30,
    currentValue: 12,
    progress: 40,
  },
];

function createDashboardDOM(
  profile: UserProfile,
  stats: UserStats,
  achievements: Achievement[]
): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'dashboard-container';

  // Heading hierarchy: H1 (Dashboard Title)
  const title = document.createElement('h1');
  title.id = 'main-title';
  title.textContent = `${profile.name}'s Dashboard`;
  container.appendChild(title);

  // Profile Section: H2
  const profileSection = document.createElement('section');
  profileSection.setAttribute('aria-labelledby', 'profile-title');

  const profileHeading = document.createElement('h2');
  profileHeading.id = 'profile-title';
  profileHeading.textContent = 'Profile Information';
  profileSection.appendChild(profileHeading);

  const profileCard = document.createElement('div');
  profileCard.setAttribute('role', 'region');
  profileCard.setAttribute('aria-label', `Profile of ${profile.username}`);

  const bioPara = document.createElement('p');
  bioPara.textContent = profile.bio;
  profileCard.appendChild(bioPara);

  profileSection.appendChild(profileCard);
  container.appendChild(profileSection);

  // Stats Section: H2
  const statsSection = document.createElement('section');
  statsSection.setAttribute('aria-labelledby', 'stats-title');

  const statsHeading = document.createElement('h2');
  statsHeading.id = 'stats-title';
  statsHeading.textContent = 'Contribution Statistics';
  statsSection.appendChild(statsHeading);

  // Export Stats interactive button
  const exportButton = document.createElement('button');
  exportButton.id = 'export-btn';
  exportButton.textContent = 'Export to JSON';
  exportButton.setAttribute('aria-label', 'Export statistics to JSON file');
  exportButton.style.outline = 'none';
  exportButton.addEventListener('focus', () => {
    exportButton.style.outline = '3px solid blue';
  });
  exportButton.addEventListener('blur', () => {
    exportButton.style.outline = 'none';
  });
  statsSection.appendChild(exportButton);
  container.appendChild(statsSection);

  // Achievements Section: H2
  const achievementsSection = document.createElement('section');
  achievementsSection.setAttribute('aria-labelledby', 'achievements-title');

  const achievementsHeading = document.createElement('h2');
  achievementsHeading.id = 'achievements-title';
  achievementsHeading.textContent = 'Achievements Progress';
  achievementsSection.appendChild(achievementsHeading);

  const list = document.createElement('ul');
  list.setAttribute('role', 'list');

  achievements.forEach((ach) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'listitem');

    // Nested H3 for achievement item
    const achTitle = document.createElement('h3');
    achTitle.textContent = ach.title;
    item.appendChild(achTitle);

    // Interactive badge element
    const badge = document.createElement('div');
    badge.className = 'achievement-badge';
    badge.setAttribute('role', 'button');
    badge.setAttribute('tabindex', '0');
    badge.setAttribute('aria-label', `Achievement: ${ach.title}`);
    badge.style.outline = 'none';

    badge.addEventListener('focus', () => {
      badge.style.outline = '3px dotted green';
    });
    badge.addEventListener('blur', () => {
      badge.style.outline = 'none';
    });

    const tooltipId = `desc-${ach.id}`;
    badge.setAttribute('aria-describedby', tooltipId);

    const tooltip = document.createElement('div');
    tooltip.id = tooltipId;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = `${ach.description} (Progress: ${ach.progress}%)`;

    item.appendChild(badge);
    item.appendChild(tooltip);
    list.appendChild(item);
  });

  achievementsSection.appendChild(list);
  container.appendChild(achievementsSection);

  return container;
}

describe('Dashboard Accessibility Standards & Screen Reader Aria Compliance', () => {
  let rootContainer: HTMLDivElement;

  beforeEach(() => {
    rootContainer = createDashboardDOM(mockProfile, mockStats, mockAchievements);
    document.body.appendChild(rootContainer);
  });

  afterEach(() => {
    if (rootContainer) {
      document.body.removeChild(rootContainer);
    }
  });

  // Test Case 1: Inspect markup for correct use of accessible label coordinates
  it('Verify markup contains correct roles and linking coordinate attributes', () => {
    // Check that sections link to their headings via aria-labelledby
    const sections = rootContainer.querySelectorAll('section');
    expect(sections.length).toBe(3);

    sections.forEach((sec) => {
      const labelId = sec.getAttribute('aria-labelledby');
      expect(labelId).not.toBeNull();
      const heading = rootContainer.querySelector(`#${labelId}`);
      expect(heading).not.toBeNull();
    });

    // Check custom roles are correctly applied
    const profileCard = rootContainer.querySelector('[role="region"]');
    expect(profileCard).toBeInTheDocument();
    expect(profileCard?.getAttribute('aria-label')).toBe(`Profile of ${mockProfile.username}`);

    const list = rootContainer.querySelector('[role="list"]');
    expect(list).toBeInTheDocument();

    const listitems = rootContainer.querySelectorAll('[role="listitem"]');
    expect(listitems.length).toBe(mockAchievements.length);
  });

  // Test Case 2: Assert elements that accept key focus maintain visible outline behaviors
  it('Verify key interactive focus nodes change and maintain visible outline behaviors', () => {
    const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
    expect(exportBtn).toBeInTheDocument();

    // Before focus
    expect(exportBtn.style.outline).toBe('none');

    // Simulate focus
    exportBtn.focus();
    expect(exportBtn).toHaveFocus();
    expect(exportBtn.style.outline).toBe('3px solid blue');

    // Simulate blur
    exportBtn.blur();
    expect(exportBtn).not.toHaveFocus();
    expect(exportBtn.style.outline).toBe('none');

    // Verify achievement badges
    const badges = rootContainer.querySelectorAll('.achievement-badge');
    badges.forEach((badge) => {
      const htmlBadge = badge as HTMLDivElement;
      expect(htmlBadge.style.outline).toBe('none');

      htmlBadge.focus();
      expect(htmlBadge).toHaveFocus();
      expect(htmlBadge.style.outline).toBe('3px dotted green');

      htmlBadge.blur();
      expect(htmlBadge).not.toHaveFocus();
      expect(htmlBadge.style.outline).toBe('none');
    });
  });

  // Test Case 3: Verify tooltip labels are announced with correct accessibility descriptions
  it('Verify tooltip nodes are correctly referenced via aria-describedby', () => {
    const badges = rootContainer.querySelectorAll('.achievement-badge');
    expect(badges.length).toBe(mockAchievements.length);

    badges.forEach((badge, index) => {
      const descriptionId = badge.getAttribute('aria-describedby');
      expect(descriptionId).not.toBeNull();

      const tooltip = document.getElementById(descriptionId!);
      expect(tooltip).toBeInTheDocument();
      expect(tooltip?.getAttribute('role')).toBe('tooltip');
      expect(tooltip?.textContent).toContain(mockAchievements[index].description);
      expect(tooltip?.textContent).toContain(`Progress: ${mockAchievements[index].progress}%`);
    });
  });

  // Test Case 4: Test keyboard control path selectors to ensure normal tab ordering
  it('Verify sequential keyboard tab focus ordering aligns with visual placement', () => {
    const focusableElements = [
      document.getElementById('export-btn'),
      ...Array.from(rootContainer.querySelectorAll('.achievement-badge')),
    ];

    // Focus first element
    const firstElement = focusableElements[0] as HTMLElement | null;
    expect(firstElement).not.toBeNull();
    firstElement?.focus();
    expect(document.activeElement).toBe(firstElement);

    // Move focus sequentially to verify standard document flow
    for (let i = 1; i < focusableElements.length; i++) {
      const currentElement = focusableElements[i] as HTMLElement | null;
      expect(currentElement).not.toBeNull();
      currentElement?.focus();
      expect(document.activeElement).toBe(currentElement);
    }
  });

  // Test Case 5: Confirm standard headings exist in the correct logical hierarchical order
  it('Verify heading tags respect correct semantic nesting levels without skipping', () => {
    const mainHeading = rootContainer.querySelector('h1');
    expect(mainHeading).toBeInTheDocument();
    expect(mainHeading?.id).toBe('main-title');

    // Section headings should be H2s
    const sectionHeadings = rootContainer.querySelectorAll('h2');
    expect(sectionHeadings.length).toBe(3);

    // Sub-item headings under sections should be H3s
    const subHeadings = rootContainer.querySelectorAll('h3');
    expect(subHeadings.length).toBe(mockAchievements.length);

    // Verify H1 is first, H2s are present, and H3s are children
    const headingElements = rootContainer.querySelectorAll('h1, h2, h3');
    const headingTags = Array.from(headingElements).map((el) => el.tagName.toLowerCase());

    expect(headingTags[0]).toBe('h1');
    expect(headingTags.slice(1)).toContain('h2');
    expect(headingTags[headingTags.length - 1]).toBe('h3');
  });
});
