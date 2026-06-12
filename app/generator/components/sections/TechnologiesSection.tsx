'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { TECHNOLOGIES, TECH_CATEGORIES } from '../../data/technologies';
import { SectionCard, FieldLabel } from '../SectionCard';
import type { Technology } from '../../types';
import { getRecommendations } from '@/lib/graph/recommendationEngine';
import { TechnologyGraph } from './TechnologyGraph';

interface TechnologiesSectionProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

function TechIcon({ tech, isDark }: { tech: Technology; isDark: boolean }) {
  const filterClass = tech.type === 'simpleicon' && isDark ? 'invert brightness-200' : '';

  return (
    <img
      src={tech.iconUrl}
      alt={tech.name}
      title={tech.name}
      width={24}
      height={24}
      loading="lazy"
      className={`w-6 h-6 object-contain flex-shrink-0 ${filterClass}`}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

export function TechnologiesSection({ selected, onChange }: TechnologiesSectionProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const isDark = false;

  const categories = ['All', ...TECH_CATEGORIES];

  const filtered = useMemo(() => {
    let list = TECHNOLOGIES;
    if (activeCategory !== 'All') {
      list = list.filter((t) => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, activeCategory]);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const clearAll = () => onChange([]);
  return (
    <div id="technologies-section">
      <SectionCard
        title="Technologies"
        description="Select your tech stack"
        badge={selected.length}
        defaultOpen
      >
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none"
          />
          <label htmlFor="tech-search" className="sr-only">
            Search technologies
          </label>
          <input
            id="tech-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technologies..."
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div
          role="group"
          aria-label="Technology Categories"
          className="flex flex-wrap gap-1.5 mb-4 overflow-x-auto pb-1"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                activeCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/50 border border-transparent hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {selected.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Selected ({selected.length})</FieldLabel>
              <button
                type="button"
                onClick={clearAll}
                className="text-[10px] text-red-500 dark:text-red-400 hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selected.map((id) => {
                const tech = TECHNOLOGIES.find((t) => t.id === id);
                if (!tech) return null;
                return (
                  <div
                    key={id}
                    className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300"
                  >
                    <img
                      src={tech.iconUrl}
                      alt=""
                      width={14}
                      height={14}
                      className={`w-3.5 h-3.5 object-contain ${tech.type === 'simpleicon' && isDark ? 'invert brightness-200' : ''}`}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span>{tech.name}</span>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      className="p-0.5 rounded hover:bg-emerald-500/20 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <FieldLabel>
          {filtered.length} {activeCategory !== 'All' ? activeCategory : ''} technologies
        </FieldLabel>
        <div className="grid grid-cols-1 gap-1 max-h-72 overflow-y-auto pr-1">
          {filtered.map((tech) => {
            const isSelected = selected.includes(tech.id);
            return (
              <button
                key={tech.id}
                type="button"
                onClick={() => toggle(tech.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/5 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/8 hover:border-gray-300 dark:hover:border-white/10'
                }`}
              >
                <TechIcon tech={tech} isDark={isDark} />
                <span className="flex-1 font-medium text-xs">{tech.name}</span>
                <span className="text-[10px] text-gray-400 dark:text-white/25">
                  {tech.category}
                </span>
                <span
                  className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-gray-300 dark:border-white/20'
                  }`}
                >
                  {isSelected && (
                    <svg width="8" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-white/30">
              No technologies match your search
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
