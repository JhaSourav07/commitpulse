import Link from 'next/link';
import Image from 'next/image';
import { Globe, Sparkles, Users, GitPullRequest, ArrowRight } from 'lucide-react';

import BrandParticles from '@/components/BrandParticles';
import { Footer } from '@/app/components/Footer';

interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

async function getContributors(): Promise<Contributor[]> {
  try {
    const res = await fetch('https://api.github.com/repos/JhaSourav07/commitpulse/contributors', {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return [];
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
    <main className="relative min-h-screen overflow-x-hidden bg-transparent text-white">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <BrandParticles />

        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[90px]" />

        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[90px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_60%)]" />
      </div>

      <div className="relative z-10">
        {/* HERO SECTION */}
        <section className="mx-auto flex max-w-7xl flex-col items-center px-6 pt-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-cyan-400" />

            <span className="text-sm text-zinc-300">Open Source Community</span>
          </div>

          <h1 className="max-w-6xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            Meet the Builders Behind{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              CommitPulse
            </span>
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            A collective of open-source contributors shaping the future of GitHub visualization and
            developer storytelling through elegant engineering and collaboration.
          </p>
        </section>

        {/* STATS */}
        <section className="mx-auto mt-24 grid max-w-7xl grid-cols-1 gap-6 px-6 md:grid-cols-3">
          {/* Contributors */}
          <div className="group rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400/30 hover:bg-white/[0.06]">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
              <Users className="h-7 w-7 text-cyan-400" />
            </div>

            <h2 className="text-5xl font-black text-white">{contributors.length}+</h2>

            <p className="mt-3 text-zinc-400">Global contributors actively building CommitPulse.</p>
          </div>

          {/* Contributions */}
          <div className="group rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-purple-400/30 hover:bg-white/[0.06]">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-400/10">
              <GitPullRequest className="h-7 w-7 text-purple-400" />
            </div>

            <h2 className="text-5xl font-black text-white">{totalContributions}+</h2>

            <p className="mt-3 text-zinc-400">
              Combined open-source contributions powering the ecosystem.
            </p>
          </div>

          {/* OSS */}
          <div className="group rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-400/30 hover:bg-white/[0.06]">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10">
              <Globe className="h-7 w-7 text-blue-400" />
            </div>

            <h2 className="text-5xl font-black text-white">Open Source</h2>

            <p className="mt-3 text-zinc-400">
              Built by developers, for developers, powered by community.
            </p>
          </div>
        </section>

        {/* GRAPH */}
        <section className="mx-auto mt-32 max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-black text-white md:text-5xl">Contribution Activity</h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
              The most active contributors helping shape the future of CommitPulse.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <div className="space-y-6">
              {topContributors.map((contributor, index) => (
                <div key={contributor.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-zinc-500">#{index + 1}</span>

                      <span className="font-medium text-white">{contributor.login}</span>
                    </div>

                    <span className="text-sm text-zinc-400">
                      {contributor.contributions} contributions
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
                      style={{
                        width: `${
                          (contributor.contributions / topContributors[0].contributions) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTRIBUTORS GRID */}
        <section className="mx-auto mt-32 max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-black text-white md:text-5xl">Community Contributors</h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
              Developers from around the world contributing to the evolution of CommitPulse.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {contributors.map((contributor) => (
              <Link
                key={contributor.id}
                href={contributor.html_url}
                target="_blank"
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:border-cyan-400/30 hover:bg-white/[0.06]"
              >
                {/* GLOW */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute -top-24 right-0 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* AVATAR */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <Image
                      src={contributor.avatar_url}
                      alt={contributor.login}
                      width={110}
                      height={110}
                      className="relative rounded-full border-4 border-white/10 transition-all duration-500 group-hover:border-cyan-400/40"
                    />
                  </div>

                  <h3 className="mt-6 text-2xl font-bold text-white">{contributor.login}</h3>

                  <p className="mt-2 text-zinc-400">{contributor.contributions} contributions</p>

                  <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-zinc-300 transition-all duration-300 group-hover:border-cyan-400/30 group-hover:bg-cyan-400/10 group-hover:text-white">
                    <Globe className="h-4 w-4" />
                    View Profile
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-32 mb-12 max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-12 text-center backdrop-blur-xl">
            <div className="absolute inset-0">
              <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
                <Sparkles className="h-4 w-4 text-cyan-400" />

                <span className="text-sm text-zinc-300">Join the Community</span>
              </div>

              <h2 className="mx-auto max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">
                Want to shape the future of CommitPulse?
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
                Contribute features, improve visualizations, optimize performance, and help build
                the next generation of GitHub storytelling tools.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="https://github.com/JhaSourav07/commitpulse"
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 px-8 py-4 font-semibold text-white transition-all duration-300 hover:scale-105"
                >
                  <Globe className="h-5 w-5" />
                  View Repository
                </Link>

                <Link
                  href="https://github.com/JhaSourav07/commitpulse/issues"
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-semibold text-zinc-300 transition-all duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
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
