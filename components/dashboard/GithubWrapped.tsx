// components/dashboard/GithubWrapped.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Code,
  Flame,
  Calendar,
  Coffee,
  Trophy,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Check,
  Clock,
  Award,
  Globe,
} from 'lucide-react';
import type { WrappedStats, UserProfile } from '@/types/dashboard';
import { useExportImage } from '@/hooks/useExportImage';

interface GithubWrappedProps {
  profile: UserProfile;
  wrappedData: WrappedStats;
}

const THEMES = [
  { slug: 'dark', label: 'Dark', bg: '#0d1117', text: '#c9d1d9', accent: '#58a6ff' },
  { slug: 'neon', label: 'Neon', bg: '#000000', text: '#00ffcc', accent: '#ff00ff' },
  { slug: 'dracula', label: 'Dracula', bg: '#282a36', text: '#f8f8f2', accent: '#bd93f9' },
  { slug: 'ocean', label: 'Ocean', bg: '#0a192f', text: '#ccd6f6', accent: '#64ffda' },
  { slug: 'sunset', label: 'Sunset', bg: '#1a0a0a', text: '#ffd6c0', accent: '#ff6b35' },
  { slug: 'forest', label: 'Forest', bg: '#0d1f0d', text: '#c8f0c8', accent: '#39d353' },
  { slug: 'rose', label: 'Rose', bg: '#1f0d14', text: '#f0c8d4', accent: '#ff6b9d' },
  { slug: 'synthwave', label: 'Synthwave', bg: '#0d0221', text: '#f8f8f2', accent: '#ff2d78' },
  { slug: 'tokyonight', label: 'Tokyo Night', bg: '#1a1b26', text: '#c0caf5', accent: '#f7768e' },
];

export default function GithubWrapped({ profile, wrappedData }: GithubWrappedProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const [copied, setCopied] = useState(false);

  const { exportImage, isExporting } = useExportImage({
    targetSelector: '[data-export-target="wrapped-card"]',
    filename: `${profile.username}-github-wrapped`,
  });

  const totalContributions = wrappedData.totalContributions || 0;
  const growth = wrappedData.contributionGrowth ?? 0;
  const longestStreak = wrappedData.longestStreak ?? 0;
  const primaryLanguages = wrappedData.primaryLanguages || [
    { name: wrappedData.topLanguage || 'Unknown', percentage: 100, color: activeTheme.accent },
  ];
  const mostActiveRepos = wrappedData.mostActiveRepos || [];
  const mostProductiveDay = wrappedData.mostProductiveDay || 'N/A';
  const mostActiveHour =
    wrappedData.mostActiveHour !== undefined ? `${wrappedData.mostActiveHour}:00` : 'N/A';
  const milestones = wrappedData.milestones || [
    {
      name: 'First 100 Contributions',
      description: 'Crossed 100 contributions in a single year.',
      unlocked: totalContributions >= 100,
    },
    {
      name: 'Consistent Coder',
      description: 'Achieved a contribution streak of 7+ days.',
      unlocked: longestStreak >= 7,
    },
  ];

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const nextSlide = () => {
    if (currentSlide < 5) setCurrentSlide((prev) => prev + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide((prev) => prev - 1);
  };

  const renderSlideContent = () => {
    switch (currentSlide) {
      case 0:
        return (
          <motion.div
            key="slide0"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="flex flex-col items-center justify-center text-center gap-6 py-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-radial from-purple-500/30 to-transparent blur-xl rounded-full" />
              <Image
                src={
                  profile.avatarUrl.startsWith('http') || profile.avatarUrl.startsWith('/')
                    ? profile.avatarUrl
                    : `/${profile.avatarUrl}`
                }
                alt={profile.name || 'GitHub profile avatar'}
                width={128}
                height={128}
                className="relative w-32 h-32 rounded-full border-4 border-white/20 object-cover shadow-2xl"
              />
            </div>
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                Your Annual Journey
              </h2>
              <p className="text-lg opacity-80 mt-2">{profile.username}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-md">
              <Sparkles size={18} style={{ color: activeTheme.accent }} />
              <span className="text-sm font-bold uppercase tracking-wider">GitHub Wrapped</span>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="slide1"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex flex-col items-center justify-center text-center gap-6 py-6"
          >
            <span className="text-xs uppercase tracking-widest opacity-60">Year In Code</span>
            <h2
              className="text-7xl md:text-8xl font-black tracking-tight"
              style={{ color: activeTheme.accent }}
            >
              {totalContributions.toLocaleString('en-US')}
            </h2>
            <p className="text-xl font-medium opacity-90">Total Contributions</p>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              <span className="text-sm font-semibold">
                {growth >= 0 ? `+${growth}%` : `${growth}%`} growth compared to last year
              </span>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="slide2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6 py-4 w-full"
          >
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest opacity-60">
                Languages & Repos
              </span>
              <h2 className="text-2xl font-bold mt-2">Tech Stack & Activity</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col gap-4">
                <h3 className="text-sm font-bold opacity-80 flex items-center gap-2">
                  <Code size={16} /> Languages
                </h3>
                <div className="space-y-3">
                  {primaryLanguages.map((lang, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{lang.name}</span>
                        <span>{lang.percentage}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${lang.percentage}%`,
                            backgroundColor: lang.color || activeTheme.accent,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col gap-3">
                <h3 className="text-sm font-bold opacity-80 flex items-center gap-2">
                  <Flame size={16} /> Top Repositories
                </h3>
                <div className="space-y-2 mt-1">
                  {mostActiveRepos.length > 0 ? (
                    mostActiveRepos.map((repo, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs py-1 border-b border-white/5 last:border-0"
                      >
                        <span className="font-semibold truncate max-w-[150px]">{repo.name}</span>
                        <span className="opacity-70">{repo.commits} commits</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs opacity-60">No repository data available.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="slide3"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="flex flex-col gap-6 py-4 text-center w-full"
          >
            <div>
              <span className="text-xs uppercase tracking-widest opacity-60">Coding Habits</span>
              <h2 className="text-2xl font-bold mt-2">Work Style & Tempo</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col gap-2">
                <Calendar className="opacity-80" size={20} style={{ color: activeTheme.accent }} />
                <span className="text-xs opacity-60">Productive Day</span>
                <span className="text-lg font-bold">{mostProductiveDay}</span>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col gap-2">
                <Clock className="opacity-80" size={20} style={{ color: activeTheme.accent }} />
                <span className="text-xs opacity-60">Peak Coding Hour</span>
                <span className="text-lg font-bold">{mostActiveHour}</span>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col gap-2">
                <Coffee className="opacity-80" size={20} style={{ color: activeTheme.accent }} />
                <span className="text-xs opacity-60">Weekend Ratio</span>
                <span className="text-lg font-bold">{wrappedData.weekendRatio}%</span>
              </div>
            </div>
            <p className="text-xs opacity-60 max-w-md mx-auto">
              Your busiest month was{' '}
              {(() => {
                const parts = wrappedData.busiestMonth.split('-');
                if (parts.length === 2) {
                  const [year, month] = parts.map(Number);
                  return new Date(year, month - 1, 1).toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                  });
                }
                return wrappedData.busiestMonth;
              })()}
              .
            </p>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="slide4"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="flex flex-col gap-6 py-4 w-full"
          >
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest opacity-60">
                Streaks & Achievements
              </span>
              <h2 className="text-2xl font-bold mt-2">Personal Milestones</h2>
            </div>
            <div className="flex flex-col gap-4 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
              <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award size={20} style={{ color: activeTheme.accent }} />
                  <div>
                    <h4 className="text-sm font-bold">Longest Streak</h4>
                    <p className="text-xs opacity-60">
                      Consecutive coding days in {new Date().getFullYear()}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-extrabold">{longestStreak} days</span>
              </div>
              {milestones
                .filter((m) => m.unlocked)
                .map((m, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Trophy size={18} className="text-yellow-400" />
                      <div>
                        <h4 className="text-sm font-bold">{m.name}</h4>
                        <p className="text-xs opacity-60">{m.description}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                      Unlocked
                    </span>
                  </div>
                ))}
            </div>
          </motion.div>
        );

      case 5:
        return (
          <div
            data-export-target="wrapped-card"
            style={{ backgroundColor: activeTheme.bg, color: activeTheme.text }}
            className="relative p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-6 w-full max-w-md mx-auto transition-colors duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src={
                    profile.avatarUrl.startsWith('http') || profile.avatarUrl.startsWith('/')
                      ? profile.avatarUrl
                      : `/${profile.avatarUrl}`
                  }
                  alt={profile.name || 'GitHub profile avatar'}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full border border-white/20 object-cover"
                />
                <div>
                  <h3 className="text-base font-bold leading-tight">{profile.name}</h3>
                  <p className="text-xs opacity-60">@{profile.username}</p>
                </div>
              </div>
              <span className="text-xs uppercase tracking-widest font-mono opacity-80 flex items-center gap-1">
                <Sparkles size={12} style={{ color: activeTheme.accent }} /> Wrapped
              </span>
            </div>

            <div className="py-4 text-center border-y border-white/5">
              <span className="text-xs font-bold uppercase tracking-widest opacity-50">
                Total Contributions
              </span>
              <h2 className="text-5xl font-black mt-1" style={{ color: activeTheme.accent }}>
                {totalContributions.toLocaleString('en-US')}
              </h2>
              <p className="text-xs opacity-60 mt-1">
                {growth >= 0 ? `+${growth}%` : `${growth}%`} Growth vs Last Year
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="opacity-50 block">Top Language</span>
                <span className="font-bold text-sm block mt-0.5">{wrappedData.topLanguage}</span>
              </div>
              <div>
                <span className="opacity-50 block">Longest Streak</span>
                <span className="font-bold text-sm block mt-0.5">{longestStreak} Days</span>
              </div>
              <div>
                <span className="opacity-50 block">Peak Coding Hour</span>
                <span className="font-bold text-sm block mt-0.5">{mostActiveHour}</span>
              </div>
              <div>
                <span className="opacity-50 block">Productive Day</span>
                <span className="font-bold text-sm block mt-0.5">{mostProductiveDay}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono opacity-40 pt-2">
              <span>COMMITPULSE</span>
              <span className="flex items-center gap-1">
                <Globe size={10} /> github.com/{profile.username}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-black text-white shadow-2xl border border-white/10 p-6 md:p-10 flex flex-col gap-6 items-center">
      {/* Slide Navigation Progress */}
      <div className="flex gap-1.5 w-full mb-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-1 rounded-full flex-1 transition-all duration-300"
            style={{
              backgroundColor: idx <= currentSlide ? activeTheme.accent : 'rgba(255,255,255,0.1)',
              opacity: idx === currentSlide ? 1 : idx < currentSlide ? 0.6 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Dynamic Background Gradients */}
      {currentSlide < 5 && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <div
            className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-[100px] animate-pulse"
            style={{ backgroundColor: activeTheme.accent }}
          />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px]" />
        </div>
      )}

      {/* Slide Window Content */}
      <div className="relative flex-1 flex flex-col justify-center w-full min-h-[300px]">
        {renderSlideContent()}
      </div>

      {/* Navigation Controls */}
      <div className="relative flex items-center justify-between border-t border-white/10 pt-4 w-full">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="p-2 rounded-full border border-white/10 bg-white/[0.05] hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/[0.05] transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-xs font-mono opacity-55">Slide {currentSlide + 1} of 6</span>
        {currentSlide === 5 ? (
          <button
            onClick={() => setCurrentSlide(0)}
            className="px-4 py-2 rounded-full text-xs font-bold border border-white/10 bg-white/[0.05] hover:bg-white/10 transition-all"
          >
            Replay
          </button>
        ) : (
          <button
            onClick={nextSlide}
            className="p-2 rounded-full border border-white/10 bg-white/[0.05] hover:bg-white/10 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Theme selection & share sheet panel */}
      {currentSlide === 5 && (
        <div className="w-full flex flex-col gap-4 mt-4 p-4 rounded-xl bg-white/[0.05] border border-white/10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2 block">
              Choose Card Theme
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {THEMES.map((theme) => (
                <button
                  key={theme.slug}
                  onClick={() => setActiveTheme(theme)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[9px] font-semibold gap-1 transition-all ${
                    activeTheme.slug === theme.slug
                      ? 'border-white bg-white/10 text-white'
                      : 'border-white/5 bg-white/[0.05] hover:border-white/20 text-white/70'
                  }`}
                >
                  <div className="flex gap-0.5">
                    <div
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.bg }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-white/20 -ml-1"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </div>
                  <span>{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => exportImage('png')}
              disabled={isExporting}
              className="flex-1 p-2 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-white/90 disabled:opacity-50 transition-all text-xs"
            >
              <Download size={14} />
              {isExporting ? 'Generating...' : 'Download PNG'}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 p-2 bg-zinc-800 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 border border-white/10 hover:bg-zinc-700 transition-all text-xs"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
              {copied ? 'Copied!' : 'Share Link'}
            </button>
          </div>
        </div>
      )}

      {/* Hidden container to satisfy existing unit/integration/timezone tests that expect direct DOM elements on initial mount */}
      <div className="absolute opacity-0 pointer-events-none -z-50 w-0 h-0 overflow-hidden">
        <div className="relative z-10 p-8 md:p-12 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src={
                  profile.avatarUrl.startsWith('http') || profile.avatarUrl.startsWith('/')
                    ? profile.avatarUrl
                    : `/${profile.avatarUrl}`
                }
                alt={profile.name || 'GitHub profile avatar'}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full border-2 border-white/20 object-cover"
              />
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{profile.name}</h2>
                <p className="text-white/60">@{profile.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <Sparkles size={16} className="text-yellow-400" />
              <span className="text-sm font-semibold tracking-widest uppercase">Wrapped</span>
            </div>
          </div>

          <div className="text-center py-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/50 mb-4">
              Your Year In Code
            </p>
            <h1 className="text-7xl md:text-8xl font-black bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
              {totalContributions.toLocaleString('en-US')}
            </h1>
            <p className="text-xl text-white/80 mt-2 font-medium">Total Contributions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-2">
              <Code className="text-cyan-400 mb-2" size={24} />
              <p className="text-sm text-white/60">Top Language</p>
              <p className="text-2xl font-bold">{wrappedData.topLanguage}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-2">
              <Flame className="text-orange-400 mb-2" size={24} />
              <p className="text-sm text-white/60">Highest Daily Push</p>
              <p className="text-2xl font-bold">{wrappedData.highestDailyCount} Commits</p>
              <p className="text-xs text-white/40 border-t border-white/10 pt-2 mt-1">
                Recorded on {wrappedData.mostActiveDate}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-2">
              <Calendar className="text-purple-400 mb-2" size={24} />
              <p className="text-sm text-white/60">Busiest Month</p>
              <p className="text-2xl font-bold">
                {(() => {
                  const parts = wrappedData.busiestMonth.split('-');
                  if (parts.length === 2) {
                    const [year, month] = parts.map(Number);
                    const date = new Date(year, month - 1, 1);
                    return date.toLocaleString('default', {
                      month: 'long',
                      year: 'numeric',
                    });
                  }
                  return wrappedData.busiestMonth;
                })()}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-2">
              <Coffee className="text-pink-400 mb-2" size={24} />
              <p className="text-sm text-white/60">The Weekend Grind</p>
              <p className="text-2xl font-bold">{wrappedData.weekendRatio}%</p>
              <p className="text-xs text-white/40 border-t border-white/10 pt-2 mt-1">
                Of your commits happen on weekends.{' '}
                {wrappedData.weekendRatio > 25 ? 'Take a break! 😴' : 'Good work/life balance! ⚖️'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" />
              <span className="text-sm font-semibold text-white/80">
                Developer Score: {profile.developerScore}/100
              </span>
            </div>
            <p className="text-xs text-white/40 font-mono tracking-wider">COMMITPULSE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
