'use client';

import { useState, useMemo } from 'react';
import { Search, X, ExternalLink } from 'lucide-react';
import { SOCIALS, SOCIAL_CATEGORIES } from '../../data/socials';
import { SectionCard, FieldLabel } from '../SectionCard';
import type { Social } from '../../types';

interface SocialsSectionProps {
  selected: string[];
  socialLinks: Record<string, string>;
  onSelectedChange: (ids: string[]) => void;
  onLinkChange: (id: string, url: string) => void;
}

function SocialIcon({ social, isDark }: { social: Social; isDark: boolean }) {
  const filterClass = social.type === 'simpleicon' && isDark ? 'invert brightness-200' : '';
  return (
    <img
      src={social.iconUrl}
      alt={social.name}
      title={social.name}
      width={20}
      height={20}
      loading="lazy"
      className={`w-5 h-5 object-contain flex-shrink-0 ${filterClass}`}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

export function SocialsSection({
  selected,
  socialLinks,
  onSelectedChange,
  onLinkChange,
}: SocialsSectionProps) {
  const safeSelected = Array.isArray(selected) ? selected : [];
  const safeSocialLinks = socialLinks || {};
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'pick' | 'links'>('pick');

  const isDark = false;

  const categories = ['All', ...SOCIAL_CATEGORIES];

  const filtered = useMemo(() => {
    let list = SOCIALS;
    if (activeCategory !== 'All') {
      list = list.filter((s) => s.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, activeCategory]);

  const toggle = (id: string) => {
    if (safeSelected.includes(id)) {
      onSelectedChange(safeSelected.filter((s) => s !== id));
    } else {
      onSelectedChange([...safeSelected, id]);
    }
  };

  const filledCount = safeSelected.filter((id) => safeSocialLinks[id]?.trim()).length;

  return (
    <div id="socials-section">
      <SectionCard
        title="Socials"
        description="Add links to your profiles"
        badge={safeSelected.length}
        defaultOpen
      >
        <div
          role="tablist"
          aria-label="Socials settings tabs"
          className="flex rounded-xl bg-gray-100 dark:bg-white/5 p-1 mb-4 gap-1"
        >
          {(['pick', 'links'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`tab-social-${tab}`}
              aria-selected={activeTab === tab}
              aria-controls={`panel-social-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                activeTab === tab
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'
              }`}
            >
              {tab === 'pick'
                ? '① Pick Platforms'
                : `② Add Links${filledCount > 0 ? ` (${filledCount})` : ''}`}
            </button>
          ))}
        </div>

        {activeTab === 'pick' && (
          <div role="tabpanel" id="panel-social-pick" aria-labelledby="tab-social-pick">
            <div className="relative mb-3">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search platforms..."
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
                    onClick={() => onSelectedChange([])}
                    className="text-[10px] text-red-500 dark:text-red-400 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {safeSelected.map((id) => {
                    const social = SOCIALS.find((s) => s.id === id);
                    if (!social) return null;
                    const hasLink = !!safeSocialLinks[id]?.trim();
                    return (
                      <div
                        key={id}
                        className={`inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg text-[11px] border ${
                          hasLink
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        <img
                          src={social.iconUrl}
                          alt=""
                          width={12}
                          height={12}
                          className={`w-3 h-3 object-contain ${social.type === 'simpleicon' && isDark ? 'invert brightness-200' : ''}`}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span>{social.name}</span>
                        {!hasLink && <span className="text-[9px] opacity-60">(no link)</span>}
                        <button
                          type="button"
                          onClick={() => toggle(id)}
                          className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('links')}
                  className="mt-2 w-full py-1.5 rounded-lg border border-dashed border-emerald-500/30 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5 transition-colors"
                >
                  &rarr; Add links for selected platforms
                </button>
              </div>
            )}

            <FieldLabel>{filtered.length} platforms</FieldLabel>
            <div className="grid grid-cols-1 gap-1 max-h-72 overflow-y-auto pr-1">
              {filtered.map((social) => {
                const isSelected = safeSelected.includes(social.id);
                return (
                  <button
                    key={social.id}
                    type="button"
                    onClick={() => toggle(social.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/5 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/8 hover:border-gray-300 dark:hover:border-white/10'
                    }`}
                  >
                    <SocialIcon social={social} isDark={isDark} />
                    <span className="flex-1 font-medium text-xs">{social.name}</span>
                    <span className="text-[10px] text-gray-400 dark:text-white/25">
                      {social.category}
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
                  No platforms match your search
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <div
            role="tabpanel"
            id="panel-social-links"
            aria-labelledby="tab-social-links"
            className="space-y-3"
          >
            {safeSelected.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400 dark:text-white/30 mb-3">
                  No platforms selected yet
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('pick')}
                  className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  &larr; Pick platforms first
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 dark:text-white/40 mb-3">
                  Platforms without a URL will be excluded from the README.
                </p>
                {safeSelected.map((id) => {
                  const social = SOCIALS.find((s) => s.id === id);
                  if (!social) return null;
                  const val = safeSocialLinks[id] ?? '';
                  const hasLink = !!val.trim();

                  return (
                    <div key={id}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <img
                          src={social.iconUrl}
                          alt=""
                          width={14}
                          height={14}
                          className={`w-3.5 h-3.5 object-contain flex-shrink-0 ${social.type === 'simpleicon' && isDark ? 'invert brightness-200' : ''}`}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <label
                          htmlFor={`social-link-${id}`}
                          className="text-xs font-semibold text-gray-700 dark:text-white/70 cursor-pointer"
                        >
                          {social.name}
                        </label>
                        {hasLink && (
                          <a
                            href={
                              social.id === 'email' ? `mailto:${val.replace(/^mailto:/, '')}` : val
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-emerald-500 hover:text-emerald-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id={`social-link-${id}`}
                          type={social.id === 'email' ? 'email' : 'url'}
                          value={val}
                          onChange={(e) => onLinkChange(id, e.target.value)}
                          placeholder={social.placeholder}
                          className={`w-full rounded-xl border px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 transition-colors ${
                            hasLink
                              ? 'border-emerald-500/30 focus:ring-emerald-500/30'
                              : 'border-gray-200 dark:border-white/10 focus:ring-emerald-500/40'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
