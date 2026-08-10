import { getTechById, getShieldsBadgeUrl } from '../data/technologies';
import { getSocialById } from '../data/socials';
import { validateSocialHandle, sanitizeSocialUrl } from './urlSanitizer';
import type { GeneratorState } from '../types';

const BADGE_BASE = 'https://commitpulse.vercel.app/api/streak';
const DASHBOARD_BASE = 'https://commitpulse.vercel.app/dashboard';

function diImg(iconUrl: string, name: string, size = 40): string {
  return `<img src="${iconUrl}" alt="${name}" width="${size}" height="${size}" title="${name}" />`;
}

function buildBadgeUrl(username: string, accentHex: string): string {
  const params = new URLSearchParams({ user: username });
  const cleaned = accentHex.replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    params.set('accent', cleaned);
  }
  return `${BADGE_BASE}?${params.toString()}`;
}

function buildGraphsMarkdown(state: GeneratorState): string | null {
  if (!state.githubUsername || !state.githubUsername.trim()) return null;
  if (!state.showSnakeGraph && !state.showPacmanGraph) return null;

  const username = state.githubUsername.trim();
  const graphSections: string[] = [];

  if (state.showSnakeGraph) {
    graphSections.push(
      [
        '## 🐍 Snake Contribution Graph',
        '',
        '<div align="center">',
        '  <picture>',
        `    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/${username}/${username}/output/github-snake-dark.svg" />`,
        `    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/${username}/${username}/output/github-snake.svg" />`,
        `    <img alt="github contribution grid snake svg" src="https://raw.githubusercontent.com/${username}/${username}/output/github-snake.svg" />`,
        '  </picture>',
        '</div>',
      ].join('\n')
    );
  }

  if (state.showPacmanGraph) {
    graphSections.push(
      [
        '## 👾 Pacman Contribution Graph',
        '',
        '<div align="center">',
        '  <picture>',
        `    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/${username}/${username}/output/pacman-contribution-graph-dark.svg" />`,
        `    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/${username}/${username}/output/pacman-contribution-graph.svg" />`,
        `    <img alt="pacman contribution graph" src="https://raw.githubusercontent.com/${username}/${username}/output/pacman-contribution-graph.svg" />`,
        '  </picture>',
        '</div>',
      ].join('\n')
    );
  }

  return graphSections.join('\n\n');
}

function buildHeaderSection(state: GeneratorState): string | null {
  const name = state.name?.trim();
  const description = state.description?.trim();

  if (name) {
    const headerLines: string[] = ['<div align="center">', '', `# 👋 Hi, I'm ${name}`];

    if (description) {
      headerLines.push('');
      headerLines.push(`<p>${description}</p>`);
    }

    headerLines.push('');
    headerLines.push('div>');
    // Fix: close div properly
    headerLines[headerLines.length - 1] = '</div>';
    return headerLines.join('\n');
  } else if (description) {
    return `<div align="center">\n\n<p>${description}</p>\n\n</div>`;
  }
  return null;
}

function buildHeroSection(state: GeneratorState): string | null {
  if (!state.showHeroImage || !state.heroImageUrl?.trim()) return null;

  const url = state.heroImageUrl.trim();
  const align = state.heroImageAlign || 'center';
  const alt = state.heroImageAlt?.trim() || 'Coding GIF';
  const width = state.heroImageWidth?.trim();

  const imgLines: string[] = [
    `<p align="${align}">`,
    '  <img',
    `    src="${url}"`,
    `    alt="${alt}"`,
  ];

  if (width) {
    imgLines.push(`    width="${width}"`);
  }

  imgLines.push('  />', '</p>');
  return imgLines.join('\n');
}

function buildTechSection(state: GeneratorState): string | null {
  if (!state.selectedTechs || state.selectedTechs.length === 0) return null;

  const techLines: string[] = ['## 🛠️ Tech Stack', '', '<div align="center">'];
  const iconDisplay = state.techIconDisplay || 'logo';

  const techIcons = state.selectedTechs
    .map((id) => {
      const tech = getTechById(id);
      if (!tech) return null;

      if (iconDisplay === 'logo-name') {
        const badgeUrl = getShieldsBadgeUrl(tech, state.techBadgeBgColor, state.techBadgeLogoColor);
        return `<img src="${badgeUrl}" alt="${tech.name}" title="${tech.name}" style="margin: 4px;" />`;
      }

      if (tech.type === 'simpleicon') {
        const slug = tech.iconUrl.split('/').pop() || id;
        const dark = `https://cdn.simpleicons.org/${slug}/ffffff`;
        const light = `https://cdn.simpleicons.org/${slug}/000000`;
        return [
          '<picture>',
          `  <source media="(prefers-color-scheme: dark)" srcset="${dark}" />`,
          `  <img src="${light}" alt="${tech.name}" width="40" height="40" title="${tech.name}" />`,
          '</picture>',
        ].join('\n');
      } else {
        return diImg(tech.iconUrl, tech.name);
      }
    })
    .filter(Boolean);

  techLines.push('');
  techLines.push(techIcons.join('\n&nbsp;\n'));
  techLines.push('');
  techLines.push('</div>');
  return techLines.join('\n');
}

function buildSocialsSection(state: GeneratorState): string | null {
  if (!state.selectedSocials || state.selectedSocials.length === 0) return null;

  const activeSocials = state.selectedSocials.filter((id) => {
    const val = state.socialLinks?.[id];
    if (!val?.trim()) return false;
    const sanitized = sanitizeSocialUrl(id, val);
    return validateSocialHandle(id, sanitized);
  });

  if (activeSocials.length === 0) return null;

  const socialLines: string[] = ['## 🌐 Connect With Me', '', '<div align="center">'];

  const badges = activeSocials
    .map((id) => {
      const social = getSocialById(id);
      if (!social) return null;
      const val = state.socialLinks?.[id] || '';
      const sanitized = sanitizeSocialUrl(id, val);
      let resolvedUrl =
        social.id === 'email'
          ? `mailto:${sanitized.replace(/^mailto:/i, '')}`
          : sanitized.startsWith('http')
            ? sanitized
            : `${social.baseUrl || ''}${sanitized}`;

      if (social.id !== 'email' && !/^https?:\/\//i.test(resolvedUrl)) {
        resolvedUrl = `https://${resolvedUrl}`;
      }

      if (social.type === 'simpleicon' && social.siSlug) {
        return [
          `<a href="${resolvedUrl}" target="_blank" rel="noopener noreferrer">`,
          '  <picture>',
          `    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.simpleicons.org/${social.siSlug}/ffffff" />`,
          `    <img src="https://cdn.simpleicons.org/${social.siSlug}/000000" alt="${social.name}" width="36" height="36" title="${social.name}" />`,
          '  </picture>',
          '</a>',
        ].join('\n');
      } else {
        return [
          `<a href="${resolvedUrl}" target="_blank" rel="noopener noreferrer">`,
          `  <img src="${social.iconUrl}" alt="${social.name}" width="36" height="36" title="${social.name}" />`,
          '</a>',
        ].join('\n');
      }
    })
    .filter(Boolean);

  socialLines.push('');
  socialLines.push(badges.join('\n&nbsp;\n'));
  socialLines.push('');
  socialLines.push('</div>');
  return socialLines.join('\n');
}

function buildCommitPulseSection(state: GeneratorState): string | null {
  if (!state.showCommitPulse || !state.githubUsername?.trim()) return null;

  const username = state.githubUsername.trim();
  const badgeUrl = buildBadgeUrl(username, state.commitPulseAccent || '');
  const dashboardUrl = `${DASHBOARD_BASE}/${username}`;
  const altText = `CommitPulse Contribution Graph for ${username}`;

  const commitPulseLines = [
    '## 📊 GitHub Streak',
    '',
    '<div align="center">',
    '',
    `[![${altText}](${badgeUrl})](${dashboardUrl})`,
    '',
    '</div>',
  ];

  return commitPulseLines.join('\n');
}

function buildSpotlightSection(state: GeneratorState): string | null {
  if (!state.showRepoSpotlight || !state.githubUsername?.trim() || !state.spotlightRepo)
    return null;

  const username = state.githubUsername.trim();
  const repo = state.spotlightRepo.trim();

  const params = new URLSearchParams({ user: username, repo });
  const cleaned = (state.commitPulseAccent || '').replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    params.set('accent', cleaned);
  }
  const spotlightBadgeUrl = `https://commitpulse.vercel.app/api/spotlight?${params.toString()}`;
  const repoUrl = `https://github.com/${username}/${repo}`;
  const altText = `Repository Spotlight: ${repo}`;

  const spotlightLines = [
    '## 🌟 Repository Spotlight',
    '',
    '<div align="center">',
    '',
    `[![${altText}](${spotlightBadgeUrl})](${repoUrl})`,
    '',
    '</div>',
  ];

  return spotlightLines.join('\n');
}

function buildArticlesSection(state: GeneratorState): string | null {
  if (!state.showArticles || !state.articlesUsername?.trim()) return null;

  const username = state.articlesUsername.trim();
  const platform = state.articlesPlatform || 'devto';
  const params = new URLSearchParams({ user: username, platform });

  if (state.commitPulseAccent) {
    const cleaned = state.commitPulseAccent.replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
      params.set('accent', cleaned);
    }
  }

  const articlesBadgeUrl = `https://commitpulse.vercel.app/api/articles?${params.toString()}`;
  const blogUrl =
    platform === 'devto'
      ? `https://dev.to/${username}`
      : `https://${username.replace('.hashnode.dev', '')}.hashnode.dev/`;

  const altText = `Latest Articles from ${platform === 'devto' ? 'Dev.to' : 'Hashnode'}`;

  const articlesLines = [
    '## 📝 Latest Articles',
    '',
    '<div align="center">',
    '',
    `[![${altText}](${articlesBadgeUrl})](${blogUrl})`,
    '',
    '</div>',
  ];

  return articlesLines.join('\n');
}

type SectionKey =
  'header' | 'hero' | 'tech' | 'socials' | 'commitPulse' | 'spotlight' | 'articles' | 'graphs';

export function generateReadme(state: GeneratorState): string {
  const builtSections: Record<SectionKey, string | null> = {
    header: buildHeaderSection(state),
    hero: buildHeroSection(state),
    tech: buildTechSection(state),
    socials: buildSocialsSection(state),
    commitPulse: buildCommitPulseSection(state),
    spotlight: buildSpotlightSection(state),
    articles: buildArticlesSection(state),
    graphs: buildGraphsMarkdown(state),
  };

  const template = state.layoutTemplate || 'classic';
  let order: SectionKey[];

  if (template === 'minimalist') {
    order = ['header', 'socials', 'tech', 'hero', 'commitPulse', 'spotlight', 'articles', 'graphs'];
  } else if (template === 'data-heavy') {
    order = ['header', 'commitPulse', 'spotlight', 'graphs', 'tech', 'socials', 'hero', 'articles'];
  } else if (template === 'storyteller') {
    order = ['header', 'hero', 'articles', 'spotlight', 'tech', 'commitPulse', 'socials', 'graphs'];
  } else {
    order = ['header', 'hero', 'tech', 'socials', 'commitPulse', 'spotlight', 'articles'];
  }

  // Respect graph placement overrides if specified
  if (state.graphPlacement === 'top') {
    order = order.filter((k) => k !== 'graphs');
    const headerIdx = order.indexOf('header');
    const insertIdx = headerIdx !== -1 ? headerIdx + 1 : 0;
    order.splice(insertIdx, 0, 'graphs');
  } else if (state.graphPlacement === 'middle') {
    order = order.filter((k) => k !== 'graphs');
    const techIdx = order.indexOf('tech');
    const insertIdx = techIdx !== -1 ? techIdx + 1 : order.length;
    order.splice(insertIdx, 0, 'graphs');
  } else if (
    template === 'classic' &&
    (!state.graphPlacement || state.graphPlacement === 'bottom')
  ) {
    order = order.filter((k) => k !== 'graphs');
    order.push('graphs');
  }

  const sections: string[] = [];
  for (const key of order) {
    const content = builtSections[key];
    if (content) {
      sections.push(content);
    }
  }

  return sections.join('\n\n---\n\n');
}

export function getEmptyReadme(): string {
  return [
    '<div align="center">',
    '',
    "# 👋 Hi, I'm Your Name",
    '',
    '<p>Your description goes here...</p>',
    '',
    '</div>',
  ].join('\n');
}
