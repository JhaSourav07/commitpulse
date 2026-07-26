'use client';

import { motion } from 'framer-motion';

interface BurnoutRiskMeterProps {
  score: number;
  level: 'Low' | 'Moderate' | 'High';
  description: string;
}

export default function BurnoutRiskMeter({ score, level, description }: BurnoutRiskMeterProps) {
  // SVG circular gauge parameters
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Color theming based on risk level
  const colorConfig = {
    Low: {
      stroke: '#10b981', // emerald-500
      glow: 'rgba(16, 185, 129, 0.25)',
      text: 'text-emerald-500 dark:text-emerald-400',
      bg: 'from-emerald-500/5 to-emerald-500/0',
      badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
      track: 'stroke-emerald-500/10',
    },
    Moderate: {
      stroke: '#f59e0b', // amber-500
      glow: 'rgba(245, 158, 11, 0.25)',
      text: 'text-amber-500 dark:text-amber-400',
      bg: 'from-amber-500/5 to-amber-500/0',
      badge: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
      track: 'stroke-amber-500/10',
    },
    High: {
      stroke: '#ef4444', // red-500
      glow: 'rgba(239, 68, 68, 0.3)',
      text: 'text-rose-500 dark:text-rose-400',
      bg: 'from-rose-500/5 to-rose-500/0',
      badge: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
      track: 'stroke-rose-500/10',
    },
  };

  const colors = colorConfig[level];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center gap-6"
    >
      {/* Radial Gauge */}
      <div
        className="relative flex items-center justify-center"
        role="meter"
        aria-valuenow={clampedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Burnout risk score: ${clampedScore} out of 100 — ${level} risk`}
      >
        {/* Glow effect behind the gauge */}
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: colors.glow }}
        />

        <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
          {/* Track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`fill-none ${colors.track}`}
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="fill-none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center">
          <motion.span
            className="text-5xl font-extrabold text-gray-900 dark:text-white leading-none tracking-tight"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            {clampedScore}
          </motion.span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mt-1">
            Risk Score
          </span>
        </div>
      </div>

      {/* Risk label badge */}
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <span
          className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-widest ${colors.badge}`}
        >
          {level} Risk
        </span>
        <p className="text-sm text-gray-500 dark:text-zinc-400 text-center max-w-xs leading-relaxed">
          {description}
        </p>
      </motion.div>
    </motion.div>
  );
}
