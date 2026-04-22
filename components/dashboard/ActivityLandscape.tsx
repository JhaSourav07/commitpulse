'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ActivityData } from '@/types/dashboard';

const tabs = ['1W', '1M', '3M', '1Y'];

export default function ActivityLandscape({ data }: { data: ActivityData[] }) {
  const [activeTab, setActiveTab] = useState('3M');

  // Filter data based on tab (mock implementation)
  const getFilteredData = () => {
    let days = 90;
    if (activeTab === '1W') days = 7;
    if (activeTab === '1M') days = 30;
    if (activeTab === '1Y') days = 365;

    // Take the most recent 'days'
    const recent = data.slice(-days);

    // For large datasets, sample them down to max 60 bars for visual clarity
    if (recent.length > 60) {
      const step = Math.ceil(recent.length / 60);
      return recent.filter((_, i) => i % step === 0).slice(-60);
    }
    return recent;
  };

  const displayData = getFilteredData();
  const maxCount = Math.max(...displayData.map((d) => d.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden relative group"
    >
      {/* Glow Effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-10 gap-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Activity Landscape</h2>

        {/* Tabs */}
        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Graph Area */}
      <div className="h-[250px] w-full flex items-end justify-between gap-1 sm:gap-2 relative z-10 pt-10">
        {displayData.map((day, i) => {
          // Calculate height percentage
          const heightPercent = Math.max((day.count / maxCount) * 100, 4); // min 4% height

          // Color based on intensity
          const isHigh = day.intensity >= 3;

          return (
            <div key={i} className="relative flex-1 flex items-end group/bar h-full">
              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 px-3 py-1.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-20 flex flex-col items-center shadow-xl backdrop-blur-md whitespace-nowrap">
                <span className="text-xs text-white/70">{day.date}</span>
                <span className="text-sm font-bold text-cyan-400">{day.count} commits</span>
              </div>

              {/* The Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.01,
                  ease: 'easeOut',
                }}
                className={`w-full rounded-t-sm transition-all duration-300 ${
                  isHigh
                    ? 'bg-gradient-to-t from-purple-500 to-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                    : day.intensity > 0
                      ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 opacity-80'
                      : 'bg-white/10'
                } group-hover/bar:brightness-150 group-hover/bar:shadow-[0_0_20px_rgba(255,255,255,0.4)]`}
              >
                {/* 3D Top effect highlight */}
                <div className="w-full h-1 bg-white/30 rounded-t-sm" />
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* X-axis simple line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-2" />
    </motion.div>
  );
}
