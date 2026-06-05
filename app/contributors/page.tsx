import ContributorsClient from './ContributorsClient';

interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

function getRateLimitResetMessage(res: Response): string {
  const reset = res.headers.get('x-ratelimit-reset');

  if (!reset) {
    return '';
  }
  const resetTimestamp = parseInt(reset, 10);

  if (!Number.isFinite(resetTimestamp)) {
    return '';
  }
  const resetAt = new Date(resetTimestamp * 1000).toISOString();
  return ` Please try again after ${resetAt}.`;
}

async function getContributors(): Promise<Contributor[]> {
  try {
    const token = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
    const res = await fetch('https://api.github.com/repos/JhaSourav07/commitpulse/contributors', {
      next: { revalidate: 3600 },
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'application/vnd.github+json',
      },
    });

    if (!res.ok) {
      const remaining = res.headers.get('x-ratelimit-remaining');

      if ((res.status === 403 && remaining === '0') || res.status === 429) {
        throw new Error(
          `GitHub API rate limit exceeded.${getRateLimitResetMessage(res)} Please try again later.`
        );
      }

      throw new Error('Failed to fetch contributors');
    }

    return res.json();
  } catch (error) {
    console.error('Failed to fetch contributors:', error);
    return [];
  }
}

export default async function ContributorsPage() {
  const contributors = await getContributors();

  const totalContributions = contributors.reduce(
    (acc, contributor) => acc + contributor.contributions,
    0
  );

  const topContributors = contributors
    .slice(0, 6)
    .sort((a, b) => b.contributions - a.contributions);

  return (
    <ContributorsClient
      contributors={contributors}
      totalContributions={totalContributions}
      topContributors={topContributors}
    />
  );
}
