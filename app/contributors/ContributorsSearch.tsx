'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe } from 'lucide-react';

interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

export default function ContributorsSearch({ contributors }: { contributors: Contributor[] }) {
  const [search, setSearch] = useState('');

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = contributors.filter((c) => c.login.toLowerCase().includes(normalizedSearch));

  return (
    <>
      {/* SEARCH BAR */}
      <div className="mx-auto mb-10 max-w-xl">
        <input
          type="text"
          placeholder="Search contributors by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-white/70 px-5 py-4 text-lg outline-none backdrop-blur-md transition-all duration-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:border-white/10 dark:bg-black/30 dark:text-white dark:focus:ring-cyan-800"
        />
      </div>

      {/* NO RESULTS */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-xl font-semibold text-zinc-600 dark:text-zinc-400">
            No contributors found
          </p>
          <p className="mt-2 text-sm text-white/65">Try searching with a different name.</p>
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((contributor) => (
          <Link
            key={contributor.id}
            href={contributor.html_url}
            target="_blank"
            className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white/40 dark:border-white/10 dark:bg-white/[0.04] p-7 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none transition-all duration-500 hover:-translate-y-3 hover:border-cyan-400/30 hover:bg-white/60 dark:hover:bg-white/80 dark:hover:bg-white/[0.06]"
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

              <h3 className="mt-6 text-2xl font-bold text-black dark:text-white">
                {contributor.login}
              </h3>

              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {contributor.contributions} contributions
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5 px-5 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all duration-300 group-hover:border-cyan-400/30 group-hover:bg-cyan-400/10 group-hover:text-black dark:group-hover:text-white">
                <Globe className="h-4 w-4" />
                View Profile
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
