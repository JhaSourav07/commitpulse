'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, GitBranch, Users, UserPlus, Star, Share2 } from 'lucide-react';
import type { DashboardExportData, UserProfile } from '@/types/dashboard';
import ShareSheet from './ShareSheet';
import { useTranslation } from '@/context/TranslationContext';
/**
 * Properties for the ProfileCard component.
 */
interface ProfileCardProps {
  /**
   * The GitHub user profile data containing avatar details, name, bio,
   * location metrics, and developer tracking score attributes.
   */
  user: UserProfile;

  /**
   * The aggregated dashboard state data compiled for image export engines.
   * This object is passed down to the `ShareSheet` component to render social share layouts.
   */
  exportData: DashboardExportData;

  /**
   * Optional collection of decorative text strings representing earned system awards
   * or user achievements shown on the profile card header segment.
   */
  badges?: string[];
}

export default function ProfileCard({ user, exportData, badges }: ProfileCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-full overflow-hidden border border-black/10 dark:border-[rgba(255,255,255,0.12)]">
              <Image
                src={
                  user.avatarUrl.startsWith('http')
                    ? `${user.avatarUrl}${user.avatarUrl.includes('?') ? '&' : '?'}s=120`
                    : user.avatarUrl
                }
                alt={user.name || 'Contributor Avatar'}
                width={96}
                height={96}
                className="w-full h-full aspect-square object-cover"
              />
            </div>
            {user.isPro && (
              <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded-full tracking-wide">
                {t('dashboard.profile.pro')}
              </span>
            )}
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">
            {user.name}
          </h2>
          <p className="text-sm text-[#A1A1AA] mb-4">@{user.username}</p>
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center mb-4">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
          <p className=" text-xs xs:text-sm text-[#A1A1AA] leading-relaxed mb-5 max-w-[220px]">
            {user.bio}
          </p>

          {/* Meta */}
          <div className="flex md:flex-col justify-around gap-1.5 w-full mb-6">
            <div className="flex items-center justify-center gap-1.5 text-[#A1A1AA] text-xs">
              <MapPin size={12} />
              <span>{user.location}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[#A1A1AA] text-xs">
              <Calendar size={12} />
              <span>{user.joinedDate}</span>
            </div>
          </div>

          {/* Developer Score */}
          <div className="w-full border border-black/10 dark:border-[rgba(255,255,255,0.06)] rounded-lg p-4 mb-5 bg-gray-100 dark:bg-[#111]">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] font-medium text-[#A1A1AA] uppercase tracking-widest">
                {t('dashboard.profile.score')}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.developerScore}
              </span>
            </div>
            <div className="w-full h-1 bg-gray-300 dark:bg-[rgba(255,255,255,0.07)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${user.developerScore}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="h-full bg-black dark:bg-white rounded-full"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 w-full mb-5">
            {[
              {
                icon: GitBranch,
                label: t('dashboard.profile.repos'),
                value: user.stats.repositories,
              },
              { icon: Star, label: t('dashboard.profile.stars'), value: user.stats.stars },
              { icon: Users, label: t('dashboard.profile.followers'), value: user.stats.followers },
              {
                icon: UserPlus,
                label: t('dashboard.profile.following'),
                value: user.stats.following,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center py-3 px-2 rounded-lg bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-[rgba(255,255,255,0.06)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.12)] transition-colors duration-200"
              >
                <Icon size={13} className="text-[#A1A1AA] mb-1.5" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
                <span className="text-[9px] text-[#A1A1AA] uppercase tracking-widest mt-0.5">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA — Vercel white pill button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShareOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors duration-200"
          >
            <Share2 size={14} />
            {t('dashboard.profile.share')}
          </motion.button>
        </div>
      </motion.div>

      <ShareSheet
        username={user.username}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        exportData={exportData}
      />
    </>
  );
}
