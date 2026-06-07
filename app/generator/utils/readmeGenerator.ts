import { getTechById } from '../data/technologies';
import { getSocialById } from '../data/socials';
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

export function generateReadme(state: GeneratorState): string {
  const sections: string[] = [];

  if (state.name) {
    const headerLines: string[] = ['<div align="center">', '', `# 👋 Hi, I'm ${state.name}`];

    if (state.description) {
      headerLines.push('');
      headerLines.push(`<p>${state.description}</p>`);
    }

    headerLines.push('');
    headerLines.push('</div>');
    sections.push(headerLines.join('\n'));
  } else if (state.description) {
    sections.push(`<div align="center">\n\n<p>${state.description}</p>\n\n</div>`);
  }

  if (state.selectedTechs.length > 0) {
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
        } else {
          return diImg(tech.iconUrl, tech.name);
        }
      })
      .filter(Boolean);

    techLines.push('');
    techLines.push(techIcons.join('\n&nbsp;\n'));
    techLines.push('');
    techLines.push('</div>');
    sections.push(techLines.join('\n'));
  }

  const activeSocials = state.selectedSocials.filter((id) => state.socialLinks[id]?.trim());

  if (activeSocials.length > 0) {
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
    sections.push(socialLines.join('\n'));
  }

  if (state.showCommitPulse && state.githubUsername.trim()) {
    const username = state.githubUsername.trim();
    const badgeUrl = buildBadgeUrl(username, state.commitPulseAccent);
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

    sections.push(commitPulseLines.join('\n'));
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
