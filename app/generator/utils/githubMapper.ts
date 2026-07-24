import { SOCIALS } from '../data/socials';
import { TECHNOLOGIES } from '../data/technologies';
import { sanitizeSocialUrl } from './urlSanitizer';

export interface GitHubUser {
  name: string | null;
  bio: string | null;
  blog: string | null;
  twitter_username: string | null;
  email: string | null;
}

export interface GitHubRepo {
  language: string | null;
}

export interface GitHubSocialAccount {
  provider: string;
  url: string;
}

export interface ImportedData {
  name: string;
  description: string;
  selectedTechs: string[];
  selectedSocials: string[];
  socialLinks: Record<string, string>;
}

const languageAliasMap: Record<string, string> = {
  'c++': 'cplusplus',
  'c#': 'csharp',
  html: 'html5',
  css: 'css3',
  vue: 'vuejs',
  scss: 'sass',
  shell: 'bash',
  'jupyter notebook': 'python',
  'objective-c': 'apple',
  swift: 'swift',
};

export function mapGitHubData(
  user: GitHubUser,
  repos: GitHubRepo[],
  socialAccounts: GitHubSocialAccount[]
): ImportedData {
  const result: ImportedData = {
    name: user.name || '',
    description: user.bio || '',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
  };

  if (user.twitter_username) {
    const twitterSocial = SOCIALS.find((s) => s.id === 'twitter');
    if (twitterSocial && !result.selectedSocials.includes(twitterSocial.id)) {
      result.selectedSocials.push(twitterSocial.id);
      result.socialLinks[twitterSocial.id] = user.twitter_username;
    }
  }

  if (user.blog) {
    let url = user.blog;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    const websiteSocial = SOCIALS.find((s) => s.id === 'website');
    if (websiteSocial && !result.selectedSocials.includes(websiteSocial.id)) {
      result.selectedSocials.push(websiteSocial.id);
      result.socialLinks[websiteSocial.id] = url;
    }
  }

  if (user.email) {
    const emailSocial = SOCIALS.find((s) => s.id === 'email');
    if (emailSocial && !result.selectedSocials.includes(emailSocial.id)) {
      result.selectedSocials.push(emailSocial.id);
      result.socialLinks[emailSocial.id] = `mailto:${user.email}`;
    }
  }

  socialAccounts.forEach((account) => {
    const providerStr = account.provider.toLowerCase();
    const matchingSocial = SOCIALS.find(
      (s) =>
        s.name.toLowerCase() === providerStr ||
        s.id.toLowerCase() === providerStr ||
        account.url.toLowerCase().includes(s.id.toLowerCase())
    );

    if (matchingSocial && !result.selectedSocials.includes(matchingSocial.id)) {
      result.selectedSocials.push(matchingSocial.id);
      result.socialLinks[matchingSocial.id] = sanitizeSocialUrl(matchingSocial.id, account.url);
    }
  });

  const languageCounts: Record<string, number> = {};
  repos.forEach((repo) => {
    if (repo.language) {
      const langStr = repo.language.toLowerCase();
      languageCounts[langStr] = (languageCounts[langStr] || 0) + 1;
    }
  });

  const sortedLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);

  sortedLanguages.forEach((lang) => {
    let techId: string | null = null;

    if (languageAliasMap[lang]) {
      techId = languageAliasMap[lang];
    } else {
      const matchingTech = TECHNOLOGIES.find(
        (t) =>
          t.id === lang || t.name.toLowerCase() === lang || t.id === lang.replace(/[^a-z0-9]/g, '')
      );
      if (matchingTech) {
        techId = matchingTech.id;
      }
    }

    if (techId && !result.selectedTechs.includes(techId)) {
      result.selectedTechs.push(techId);
    }
  });

  return result;
}
