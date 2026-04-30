'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, GitBranch, Users, UserPlus, Star, Share2 } from 'lucide-react';
import { UserProfile } from '@/types/dashboard';
import ShareSheet from './ShareSheet';

export default function ProfileCard({ user }: { user: UserProfile }) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)]"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-full overflow-hidden border border-[rgba(255,255,255,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            </div>
            {user.isPro && (
              <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-white text-black px-1.5 py-0.5 rounded-full tracking-wide">
                PRO
              </span>
            )}
          </div>

          <h2 className="text-lg font-semibold text-white mb-0.5">{user.name}</h2>
          <p className="text-sm text-[#A1A1AA] mb-4">@{user.username}</p>
          <p className="text-sm text-[#A1A1AA] leading-relaxed mb-5 max-w-[220px]">{user.bio}</p>

          {/* Meta */}
          <div className="flex flex-col gap-1.5 w-full mb-6">
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
          <div className="w-full border border-[rgba(255,255,255,0.06)] rounded-lg p-4 mb-5 bg-[#111]">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] font-medium text-[#A1A1AA] uppercase tracking-widest">
                Developer Score
              </span>
              <span className="text-sm font-semibold text-white">{user.developerScore}</span>
            </div>
            <div className="w-full h-1 bg-[rgba(255,255,255,0.07)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${user.developerScore}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 w-full mb-5">
            {[
              { icon: GitBranch, label: 'Repos',     value: user.stats.repositories },
              { icon: Star,       label: 'Stars',     value: user.stats.stars },
              { icon: Users,      label: 'Followers', value: user.stats.followers },
              { icon: UserPlus,   label: 'Following', value: user.stats.following },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center py-3 px-2 rounded-lg bg-[#111] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-colors duration-200"
              >
                <Icon size={13} className="text-[#A1A1AA] mb-1.5" />
                <span className="text-sm font-semibold text-white">{value}</span>
                <span className="text-[9px] text-[#A1A1AA] uppercase tracking-widest mt-0.5">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA — Vercel white pill button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShareOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-100 transition-colors duration-200"
          >
            <Share2 size={14} />
            Share Your Pulse
          </motion.button>
        </div>
      </motion.div>

      <ShareSheet
        username={user.username}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
