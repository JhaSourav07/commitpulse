import { getTechById } from '../data/technologies';
import { getSocialById } from '../data/socials';
import type { GeneratorState, ReadmeLayoutTemplate } from '../types';

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

function getLayoutTemplate(state: GeneratorState): ReadmeLayoutTemplate {
  return state.layoutTemplate ?? 'minimalist';
}

type ReadmeSectionKey = 'tech' | 'socials' | 'commitPulse' | 'repoSpotlight' | 'articles';

const TEMPLATE_SECTION_ORDER: Record<ReadmeLayoutTemplate, ReadmeSectionKey[]> = {
  minimalist: ['tech', 'socials', 'commitPulse', 'articles', 'repoSpotlight'],
  'data-heavy': ['commitPulse', 'repoSpotlight', 'articles', 'tech', 'socials'],
  storyteller: ['socials', 'articles', 'tech', 'commitPulse', 'repoSpotlight'],
};

function buildTechSection(state: GeneratorState): string | null {
  if (state.selectedTechs.length === 0) return null;

  const techLines: string[] = ['## 🛠️ Tech Stack', '', '<div align="center">'];

  const techIcons = state.selectedTechs
    .map((id) => {
      const tech = getTechById(id);
      if (!tech) return null;

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
      }

      return diImg(tech.iconUrl, tech.name);
    })
    .filter(Boolean);

  techLines.push('');
  techLines.push(techIcons.join('\n&nbsp;\n'));
  techLines.push('');
  techLines.push('</div>');

  return techLines.join('\n');
}

function buildSocialsSection(state: GeneratorState): string | null {
  const activeSocials = state.selectedSocials.filter((id) => state.socialLinks[id]?.trim());
  if (activeSocials.length === 0) return null;

  const socialLines: string[] = ['## 🌐 Connect With Me', '', '<div align="center">'];

  const badges = activeSocials
    .map((id) => {
      const social = getSocialById(id);
      if (!social) return null;
      const url = state.socialLinks[id];
      const resolvedUrl = social.id === 'email' ? `mailto:${url.replace(/^mailto:/, '')}` : url;

      if (social.type === 'simpleicon' && social.siSlug) {
        return [
          `<a href="${resolvedUrl}" target="_blank" rel="noopener noreferrer">`,
          '  <picture>',
          `    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.simpleicons.org/${social.siSlug}/ffffff" />`,
          `    <img src="https://cdn.simpleicons.org/${social.siSlug}/000000" alt="${social.name}" width="36" height="36" title="${social.name}" />`,
          '  </picture>',
          '</a>',
        ].join('\n');
      }

      return [
        `<a href="${resolvedUrl}" target="_blank" rel="noopener noreferrer">`,
        `  <img src="${social.iconUrl}" alt="${social.name}" width="36" height="36" title="${social.name}" />`,
        '</a>',
      ].join('\n');
    })
    .filter(Boolean);

  socialLines.push('');
  socialLines.push(badges.join('\n&nbsp;\n'));
  socialLines.push('');
  socialLines.push('</div>');

  return socialLines.join('\n');
}

function buildCommitPulseSection(state: GeneratorState): string | null {
  if (!state.showCommitPulse || !state.githubUsername.trim()) return null;

  const username = state.githubUsername.trim();
  const badgeUrl = buildBadgeUrl(username, state.commitPulseAccent);
  const dashboardUrl = `${DASHBOARD_BASE}/${username}`;
  const altText = `CommitPulse Contribution Graph for ${username}`;

  return [
    '## 📊 GitHub Streak',
    '',
    '<div align="center">',
    '',
    `[![${altText}](${badgeUrl})](${dashboardUrl})`,
    '',
    '</div>',
  ].join('\n');
}

function buildRepoSpotlightSection(state: GeneratorState): string | null {
  if (!state.showRepoSpotlight || !state.githubUsername.trim() || !state.spotlightRepo) return null;

  const username = state.githubUsername.trim();
  const repo = state.spotlightRepo.trim();

  const params = new URLSearchParams({ user: username, repo });
  const cleaned = state.commitPulseAccent.replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    params.set('accent', cleaned);
  }

  const spotlightBadgeUrl = `https://commitpulse.vercel.app/api/spotlight?${params.toString()}`;
  const repoUrl = `https://github.com/${username}/${repo}`;
  const altText = `Repository Spotlight: ${repo}`;

  return [
    '## 🌟 Repository Spotlight',
    '',
    '<div align="center">',
    '',
    `[![${altText}](${spotlightBadgeUrl})](${repoUrl})`,
    '',
    '</div>',
  ].join('\n');
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

  return [
    '## 📝 Latest Articles',
    '',
    '<div align="center">',
    '',
    `[![${altText}](${articlesBadgeUrl})](${blogUrl})`,
    '',
    '</div>',
  ].join('\n');
}

export function generateReadme(state: GeneratorState): string {
  const sections: string[] = [];
  const graphsMarkdown = buildGraphsMarkdown(state);
  const layoutTemplate = getLayoutTemplate(state);

  const name = state.name?.trim();
  const description = state.description?.trim();

  if (name) {
    const headerLines: string[] = ['<div align="center">', '', `# 👋 Hi, I'm ${name}`];

    if (description) {
      headerLines.push('');
      headerLines.push(`<p>${description}</p>`);
    }

    headerLines.push('');
    headerLines.push('</div>');
    sections.push(headerLines.join('\n'));
  } else if (description) {
    sections.push(`<div align="center">\n\n<p>${description}</p>\n\n</div>`);
  }

  if (state.graphPlacement === 'top' && graphsMarkdown) {
    sections.push(graphsMarkdown);
  }

  const sectionBuilders: Record<ReadmeSectionKey, (state: GeneratorState) => string | null> = {
    tech: buildTechSection,
    socials: buildSocialsSection,
    commitPulse: buildCommitPulseSection,
    repoSpotlight: buildRepoSpotlightSection,
    articles: buildArticlesSection,
  };

  let hasInsertedMiddleGraphs = false;
  const orderedSections = TEMPLATE_SECTION_ORDER[layoutTemplate];

  for (const sectionKey of orderedSections) {
    const section = sectionBuilders[sectionKey](state);
    if (!section) continue;

    sections.push(section);

    if (state.graphPlacement === 'middle' && graphsMarkdown && !hasInsertedMiddleGraphs) {
      sections.push(graphsMarkdown);
      hasInsertedMiddleGraphs = true;
    }
  }

  if (state.graphPlacement === 'middle' && graphsMarkdown && !hasInsertedMiddleGraphs) {
    sections.push(graphsMarkdown);
  }

  if (state.graphPlacement === 'bottom' && graphsMarkdown) {
    sections.push(graphsMarkdown);
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
