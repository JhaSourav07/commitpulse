import Link from 'next/link';
import { Globe, Sparkles, Users, GitPullRequest, ArrowRight } from 'lucide-react';

import BrandParticles from '@/components/BrandParticles';
import { Footer } from '@/app/components/Footer';
import ContributorsSearch from './ContributorsSearch';
import Leaderboard from '@/components/Leaderboard';

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
    <main className="relative min-h-screen overflow-x-hidden bg-transparent text-black dark:bg-transparent dark:text-white transition-colors">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <BrandParticles />

        <div className="absolute inset-0 dark:hidden">
          <div className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-cyan-200/30 blur-[120px]" />

          <div className="absolute right-0 top-[20%] h-[500px] w-[500px] rounded-full bg-purple-200/30 blur-[120px]" />

          <div className="absolute bottom-0 left-[20%] h-[500px] w-[500px] rounded-full bg-blue-200/20 blur-[120px]" />
        </div>

        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[90px]" />

        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[90px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.03),transparent_60%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_60%)]" />
      </div>

      <div className="relative z-10">
        {/* HERO SECTION */}
        <section className="mx-auto flex max-w-7xl flex-col items-center px-6 pt-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/40 px-4 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <Sparkles className="h-4 w-4 text-cyan-400" />

            <span className="text-sm text-zinc-600 dark:text-zinc-300">Open Source Community</span>
          </div>

          <h1 className="max-w-6xl text-5xl font-black leading-[0.95] tracking-tight text-black dark:text-white sm:text-6xl md:text-7xl lg:text-8xl">
            Meet the Builders Behind{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              CommitPulse
            </span>
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-xl">
            A collective of open-source contributors shaping the future of GitHub visualization and
            developer storytelling through elegant engineering and collaboration.
          </p>
          <a
            href="#contributors"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-white font-medium hover:scale-105 transition-all duration-300"
          >
            Explore Contributors →
          </a>
        </section>

        {/* STATS */}
        <section className="mx-auto mt-24 grid max-w-7xl grid-cols-1 gap-6 px-6 md:grid-cols-3">
          {/* Contributors */}
          <div className="group rounded-3xl border border-black/10 bg-white/40 dark:border-white/10 dark:bg-white/[0.04] p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400/30 hover:bg-white/80 dark:hover:bg-white/[0.06]">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
              <Users className="h-7 w-7 text-cyan-400" />
            </div>

            <h2 className="text-5xl font-black text-black dark:text-white">
              {contributors.length}+
            </h2>

            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Global contributors actively building CommitPulse.
            </p>
          </div>

          {/* Contributions */}
          <div className="group rounded-3xl border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.04] p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-purple-400/30 hover:bg-white/80 dark:hover:bg-white/[0.06]">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-400/10">
              <GitPullRequest className="h-7 w-7 text-purple-400" />
            </div>

            <h2 className="text-5xl font-black text-black dark:text-white">
              {totalContributions}+
            </h2>

            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Combined open-source contributions powering the ecosystem.
            </p>
          </div>

          {/* OSS */}
          <div className="group rounded-3xl border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.04] p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-400/30 hover:bg-white/80 dark:hover:bg-white/[0.06]">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10">
              <Globe className="h-7 w-7 text-blue-400" />
            </div>

            <h2 className="text-5xl font-black text-black dark:text-white">Open Source</h2>

            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Built by developers, for developers, powered by community.
            </p>
          </div>
        </section>

        {/* GRAPH */}
        <section className="mx-auto mt-32 max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-black text-black dark:text-white md:text-5xl">
              Contribution Activity
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              The most active contributors helping shape the future of CommitPulse.
            </p>
          </div>

          <Leaderboard contributors={topContributors} />
        </section>

        {/* CONTRIBUTORS GRID */}
        <section className="mx-auto mt-32 max-w-7xl px-6" id="contributors">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-black text-black dark:text-white md:text-5xl">
              Community Contributors
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Developers from around the world contributing to the evolution of CommitPulse.
            </p>
          </div>

          <ContributorsSearch contributors={contributors} />
        </section>

        {/* CTA */}
        <section className="mx-auto mt-32 mb-12 max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white/40 dark:border-white/10 dark:bg-white/[0.04] p-12 text-center backdrop-blur-xl">
            <div className="absolute inset-0">
              <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/40 dark:border-white/10 dark:bg-white/5 px-4 py-2 backdrop-blur-xl">
                <Sparkles className="h-4 w-4 text-cyan-400" />

                <span className="text-sm text-zinc-700 dark:text-zinc-300">Join the Community</span>
              </div>

              <h2 className="mx-auto max-w-4xl text-4xl font-black leading-tight text-black dark:text-white md:text-6xl">
                Want to shape the future of CommitPulse?
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Contribute features, improve visualizations, optimize performance, and help build
                the next generation of GitHub storytelling tools.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="https://github.com/JhaSourav07/commitpulse"
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 px-8 py-4 font-semibold text-white transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
                >
                  <Globe className="h-5 w-5" />
                  View Repository
                </Link>

                <Link
                  href="https://github.com/JhaSourav07/commitpulse/issues"
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-2xl border border-black/15 bg-white/90 dark:border-white/15 dark:bg-white/10 px-8 py-4 font-semibold text-zinc-700 dark:text-zinc-300 transition-all duration-300 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:border-cyan-400 dark:hover:bg-cyan-950/30 hover:text-zinc-900 dark:hover:text-cyan-100 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
                >
                  Start Contributing
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="mx-auto max-w-7xl px-6 pb-8">
          <Footer />
        </div>
      </div>
    </main>
  );
}
