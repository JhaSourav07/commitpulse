/**
 * Central registry of all searchable "domains" (feature pages / sections) in
 * CommitPulse. Used by the navbar search to let developers quickly jump to
 * any part of the app instead of manually browsing the nav links.
 *
 * Keep this list in sync with `app/**\/page.tsx` routes — when a new domain
 * (feature page) is added to the app, add an entry here too.
 */

export interface SearchableDomain {
  /** Stable identifier, also used as the React key */
  id: string;
  /** Primary display name */
  title: string;
  /** Short one-line description shown under the title in results */
  description: string;
  /** Route to navigate to on selection */
  href: string;
  /** Extra words that should also match this entry (synonyms, abbreviations, typos) */
  keywords: string[];
  /** Loose grouping shown as a small tag in the result row */
  category: 'Dashboard' | 'Tools' | 'Customize' | 'Community' | 'Docs';
}

export const SEARCH_DOMAINS: SearchableDomain[] = [
  {
    id: 'home',
    title: 'Home',
    description: 'Landing page — generate your contribution badge',
    href: '/',
    keywords: ['landing', 'badge', 'start', 'generate'],
    category: 'Dashboard',
  },
  {
    id: 'generator',
    title: 'Generator',
    description: 'Build a README profile section with widgets',
    href: '/generator',
    keywords: ['readme', 'profile', 'widget', 'builder', 'editor'],
    category: 'Tools',
  },
  {
    id: 'compare',
    title: 'Compare',
    description: 'Compare contribution stats between two GitHub users',
    href: '/compare',
    keywords: ['versus', 'vs', 'comparison', 'rival', 'battle'],
    category: 'Tools',
  },
  {
    id: 'burnout-analyzer',
    title: 'Burnout Radar',
    description: 'Analyze commit patterns for burnout & inactivity risk',
    href: '/burnout-analyzer',
    keywords: ['burnout', 'health', 'risk', 'analyzer', 'wellbeing', 'inactivity'],
    category: 'Tools',
  },
  {
    id: 'customize',
    title: 'Customization Studio',
    description: 'Customize themes, colors, and layout of your badge',
    href: '/customize',
    keywords: ['theme', 'colors', 'style', 'design', 'studio', 'export'],
    category: 'Customize',
  },
  {
    id: 'contributors',
    title: 'Contributors',
    description: 'Browse and search project contributors leaderboard',
    href: '/contributors',
    keywords: ['leaderboard', 'community', 'people', 'team'],
    category: 'Community',
  },
  {
    id: 'achievements',
    title: 'Achievements',
    description: 'View unlockable badges and milestones',
    href: '/achievements',
    keywords: ['badges', 'milestones', 'awards', 'unlock'],
    category: 'Dashboard',
  },
  {
    id: 'documentation',
    title: 'Documentation',
    description: 'Guides, API reference, and self-hosting docs',
    href: '/documentation',
    keywords: ['docs', 'guide', 'api', 'reference', 'help', 'faq'],
    category: 'Docs',
  },
  {
    id: 'github-repo',
    title: 'GitHub Repository',
    description: 'View the CommitPulse source code on GitHub',
    href: 'https://github.com/JhaSourav07/commitpulse',
    keywords: ['source', 'code', 'repo', 'star', 'contribute', 'oss'],
    category: 'Community',
  },
];
