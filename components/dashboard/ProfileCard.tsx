'use client';

import { motion } from 'framer-motion';
import { MapPin, Calendar, GitBranch, Users, UserPlus, Star } from 'lucide-react';
import { UserProfile } from '@/types/dashboard';

export default function ProfileCard({ user }: { user: UserProfile }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.01 }}
      className="relative p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden group"
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[150px] bg-cyan-500/20 blur-[60px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[100px] h-[100px] bg-purple-500/20 blur-[50px] rounded-full" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Avatar with Glow Ring */}
        <div className="relative mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 opacity-70 blur-md group-hover:opacity-100 transition-opacity duration-500"
          />
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-[#050505]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          </div>
          {user.isPro && (
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-[#050505] shadow-[0_0_10px_rgba(219,39,119,0.5)]">
              PRO
            </div>
          )}
        </div>

        {/* User Info */}
        <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
        <p className="text-cyan-400 font-medium mb-4">@{user.username}</p>
        <p className="text-white/70 text-sm mb-6 leading-relaxed">{user.bio}</p>

        <div className="flex flex-col gap-2 w-full mb-6">
          <div className="flex items-center justify-center gap-2 text-white/50 text-xs">
            <MapPin size={14} />
            <span>{user.location}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-white/50 text-xs">
            <Calendar size={14} />
            <span>{user.joinedDate}</span>
          </div>
        </div>

        {/* Developer Score */}
        <div className="w-full bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Developer Score
            </span>
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              {user.developerScore}
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${user.developerScore}%` }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.6)]"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          <div className="flex flex-col items-center bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
            <GitBranch size={16} className="text-cyan-400 mb-1" />
            <span className="text-lg font-bold text-white">{user.stats.repositories}</span>
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Repos</span>
          </div>
          <div className="flex flex-col items-center bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
            <Star size={16} className="text-yellow-400 mb-1" />
            <span className="text-lg font-bold text-white">{user.stats.stars}</span>
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Stars</span>
          </div>
          <div className="flex flex-col items-center bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
            <Users size={16} className="text-purple-400 mb-1" />
            <span className="text-lg font-bold text-white">{user.stats.followers}</span>
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Followers</span>
          </div>
          <div className="flex flex-col items-center bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
            <UserPlus size={16} className="text-pink-400 mb-1" />
            <span className="text-lg font-bold text-white">{user.stats.following}</span>
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Following</span>
          </div>
        </div>

        {/* CTA Button */}
        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]">
          Share Your Pulse
        </button>
      </div>
    </motion.div>
  );
}
