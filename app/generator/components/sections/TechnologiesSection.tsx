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

export function TechnologiesSection({ selected = [], onChange }: TechnologiesSectionProps) {
  const safeSelected = Array.isArray(selected) ? selected : [];
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [recCategory, setRecCategory] = useState<string>('All');
  const [expandedRecs, setExpandedRecs] = useState<string[]>([]);

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

  const recommendations = useMemo(() => getRecommendations(safeSelected), [safeSelected]);

  const filteredRecommendations = useMemo(() => {
    if (recCategory === 'All') return recommendations;
    return recommendations.filter((r) => r.category === recCategory);
  }, [recommendations, recCategory]);

  const toggle = (id: string) => {
    if (safeSelected.includes(id)) {
      onChange(safeSelected.filter((s) => s !== id));
    } else {
      onChange([...safeSelected, id]);
    }
  };

  const clearAll = () => onChange([]);

  const toggleExpandRec = (id: string) => {
    if (expandedRecs.includes(id)) {
      setExpandedRecs(expandedRecs.filter((item) => item !== id));
    } else {
      setExpandedRecs([...expandedRecs, id]);
    }
  };

  return (
    <div id="technologies-section">
      <SectionCard
        title="Technologies"
        description="Select your tech stack"
        badge={safeSelected.length}
        defaultOpen
      >
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none"
          />
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

        <div className="flex flex-wrap gap-1.5 mb-4 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/50 border border-transparent hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {safeSelected.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Selected ({safeSelected.length})</FieldLabel>
              <button
                type="button"
                onClick={clearAll}
                className="text-[10px] text-red-500 dark:text-red-400 hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {safeSelected.map((id) => {
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

        {safeSelected.length > 0 && (
          <div className="mb-6 mt-4 p-4 rounded-2xl border border-gray-200/50 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping animate-duration-1000" />
                Recommended Stack
              </h4>
              <span className="text-[10px] text-gray-500 dark:text-white/40 italic">
                Based on your current stack
              </span>
            </div>

            {recommendations.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400 dark:text-white/30">
                No recommendations available
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1 mb-3 mt-2">
                  {['All', 'Frontend', 'Backend', 'Database', 'Styling', 'Tooling'].map((cat) => {
                    const count =
                      cat === 'All'
                        ? recommendations.length
                        : recommendations.filter((r) => r.category === cat).length;
                    if (count === 0) return null;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setRecCategory(cat)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                          recCategory === cat
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                  {filteredRecommendations.map((rec) => {
                    const tech = TECHNOLOGIES.find((t) => t.id === rec.id);
                    if (!tech) return null;
                    const isExpanded = expandedRecs.includes(rec.id);

                    return (
                      <div
                        key={rec.id}
                        className="group relative flex flex-col rounded-xl border border-gray-200/60 dark:border-white/5 bg-white/60 dark:bg-white/[0.03] hover:bg-white/95 dark:hover:bg-white/[0.06] hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden"
                      >
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => toggle(rec.id)}
                            className="flex items-center gap-2.5 flex-1 text-left"
                          >
                            <div className="p-1 rounded-lg bg-gray-100 dark:bg-white/5 group-hover:scale-110 transition-transform duration-200">
                              <img
                                src={tech.iconUrl}
                                alt={tech.name}
                                width={20}
                                height={20}
                                className={`w-5 h-5 object-contain ${tech.type === 'simpleicon' && isDark ? 'invert brightness-200' : ''}`}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-gray-900 dark:text-white leading-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {tech.name}
                              </span>
                              <span className="text-[9px] text-gray-400 dark:text-white/30 mt-0.5">
                                {tech.category}
                              </span>
                            </div>
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-700 dark:text-white/80">
                              {rec.score}%
                            </span>

                            <span
                              className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                rec.strength === 'strong'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : rec.strength === 'moderate'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    : 'bg-gray-500/10 text-gray-500 dark:text-gray-400 border border-gray-500/20'
                              }`}
                            >
                              {rec.strength}
                            </span>

                            <span
                              className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                rec.category === 'Frontend'
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                  : rec.category === 'Backend'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                    : rec.category === 'Database'
                                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                                      : rec.category === 'Styling'
                                        ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                                        : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                              }`}
                            >
                              {rec.category}
                            </span>

                            <button
                              type="button"
                              onClick={() => toggleExpandRec(rec.id)}
                              className="p-1 rounded text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                              title="Why recommended?"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/10 px-4 py-2.5 text-[10px] text-gray-500 dark:text-white/50 space-y-1.5 animate-in fade-in duration-200">
                            <div className="font-bold text-gray-700 dark:text-white/70">
                              Why recommended?
                            </div>
                            <ul className="list-disc list-inside space-y-0.5">
                              {rec.reasons.map((reason, idx) => (
                                <li key={idx} className="leading-relaxed pl-1">
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <FieldLabel>
          {filtered.length} {activeCategory !== 'All' ? activeCategory : ''} technologies
        </FieldLabel>
        <div className="grid grid-cols-1 gap-1 max-h-72 overflow-y-auto pr-1">
          {filtered.map((tech) => {
            const isSelected = safeSelected.includes(tech.id);
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
