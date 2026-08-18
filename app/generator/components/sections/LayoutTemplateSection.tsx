'use client';

import { LayoutTemplate as LayoutIcon } from 'lucide-react';
import { SectionCard, FieldLabel } from '../SectionCard';
import type { LayoutTemplate } from '../../types';

interface LayoutTemplateSectionProps {
  layoutTemplate?: LayoutTemplate;
  onChange: (v: LayoutTemplate) => void;
  onReset?: () => void;
}

interface TemplateOption {
  id: LayoutTemplate;
  name: string;
  badge: string;
  icon: string;
  description: string;
  orderPreview: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'classic',
    name: 'Classic',
    badge: 'Standard',
    icon: '🏛️',
    description: 'Traditional top-down layout starting with Header and Hero banner.',
    orderPreview: 'Header → Hero → Tech → Socials → Streak → Spotlight',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    badge: 'Clean & Direct',
    icon: '🪶',
    description: 'Concise layout putting quick contact and key skills upfront.',
    orderPreview: 'Header → Socials → Tech → Hero → Streak → Articles',
  },
  {
    id: 'data-heavy',
    name: 'Data Heavy',
    badge: 'Stats First',
    icon: '📊',
    description: 'Metrics-driven structure emphasizing contribution graphs and streak stats early.',
    orderPreview: 'Header → Streak → Spotlight → Graphs → Tech → Socials',
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    badge: 'Narrative',
    icon: '📖',
    description:
      'Content and visual narrative layout featuring articles and repository spotlights.',
    orderPreview: 'Header → Hero → Articles → Spotlight → Tech → Streak',
  },
];

export function LayoutTemplateSection({
  layoutTemplate = 'classic',
  onChange,
  onReset,
}: LayoutTemplateSectionProps) {
  return (
    <SectionCard
      title="Layout Template"
      icon="📐"
      description="Choose a structural arrangement for your README sections"
      onReset={onReset}
    >
      <FieldLabel>Select Layout</FieldLabel>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2"
        role="radiogroup"
        aria-label="Layout Templates"
      >
        {TEMPLATE_OPTIONS.map((tpl) => {
          const isSelected = layoutTemplate === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(tpl.id)}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all text-xs relative ${
                isSelected
                  ? 'border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500/50'
                  : 'border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-gray-700 dark:text-white/70 hover:border-emerald-500/30 hover:bg-emerald-500/5'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                  <span className="text-base select-none">{tpl.icon}</span>
                  <span>{tpl.name}</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-emerald-500 text-white dark:bg-emerald-400 dark:text-gray-950'
                      : 'bg-gray-200/70 dark:bg-white/10 text-gray-600 dark:text-white/60'
                  }`}
                >
                  {tpl.badge}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-white/50 leading-relaxed mb-2">
                {tpl.description}
              </p>
              <div className="mt-auto pt-1.5 border-t border-gray-200/40 dark:border-white/5">
                <span className="text-[9.5px] font-mono text-gray-400 dark:text-white/40 block truncate">
                  {tpl.orderPreview}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
