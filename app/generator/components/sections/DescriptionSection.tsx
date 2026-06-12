'use client';

import { SectionCard, FieldLabel } from '../SectionCard';

interface DescriptionSectionProps {
  value: string;
  onChange: (v: string) => void;
}

const CHAR_LIMIT = 280;

export function DescriptionSection({ value, onChange }: DescriptionSectionProps) {
  const safeValue = value || '';
  const remaining = CHAR_LIMIT - safeValue.length;
  const isNearLimit = remaining < 40;

  return (
    <SectionCard
      title="Description"
      description="A short bio or tagline about yourself"
      defaultOpen
    >
      <FieldLabel htmlFor="editor-bio">Bio / Tagline</FieldLabel>
      <textarea
        id="editor-bio"
        value={safeValue}
        onChange={(e) => onChange(e.target.value.slice(0, CHAR_LIMIT))}
        placeholder="e.g. Full-stack developer passionate about building great products. Open source enthusiast. Coffee addict."
        rows={3}
        className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
      />
      <p
        className={`mt-1.5 text-right text-[11px] font-medium ${
          isNearLimit ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-white/30'
        }`}
      >
        {remaining} characters remaining
      </p>
    </SectionCard>
  );
}
