'use client';

import { SectionCard, FieldLabel } from '../SectionCard';

interface NameSectionProps {
  value: string;
  onChange: (v: string) => void;
}

export function NameSection({ value, onChange }: NameSectionProps) {
  const safeValue = value || '';
  return (
    <SectionCard title="Name" description="Your display name for the README header" defaultOpen>
      <FieldLabel>Display Name</FieldLabel>
      <input
        type="text"
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Omkar"
        maxLength={100}
        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
      />
      <p className="mt-2 text-xs text-gray-400 dark:text-white/30">
        Will appear as:{' '}
        <span className="italic text-gray-600 dark:text-white/50">
          👋 Hi, I&apos;m {value || 'Your Name'}
        </span>
      </p>
    </SectionCard>
  );
}
