'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { NameSection } from './sections/NameSection';
import { DescriptionSection } from './sections/DescriptionSection';
import { TechnologiesSection } from './sections/TechnologiesSection';
import { SocialsSection } from './sections/SocialsSection';
import { CommitPulseSection } from './sections/CommitPulseSection';
import { RepoSpotlightSection } from './sections/RepoSpotlightSection';
import { ContributionGraphSection } from './sections/ContributionGraphSection';
import { ArticlesSection } from './sections/ArticlesSection';
import { GitHubImportModal } from './GitHubImportModal';
import { FaGithub } from 'react-icons/fa';
import { PROFILE_PRESETS } from '../data/presets';
import type { GeneratorState } from '../types';
import type { ImportedData } from '../utils/githubMapper';

export interface EditorPanelProps {
  state: GeneratorState;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onTechsChange: (ids: string[]) => void;
  onSocialsChange: (ids: string[]) => void;
  onSocialLinkChange: (id: string, url: string) => void;
  onGithubUsernameChange: (v: string) => void;
  onShowCommitPulseChange: (v: boolean) => void;
  onCommitPulseAccentChange: (v: string) => void;
  showSnakeGraph?: boolean;
  showPacmanGraph?: boolean;
  graphPlacement?: 'top' | 'middle' | 'bottom';
  onShowSnakeGraphChange?: (v: boolean) => void;
  onShowPacmanGraphChange?: (v: boolean) => void;
  onGraphPlacementChange?: (v: 'top' | 'middle' | 'bottom') => void;
  showRepoSpotlight?: boolean;
  spotlightRepo?: string;
  onShowRepoSpotlightChange?: (v: boolean) => void;
  onSpotlightRepoChange?: (v: string) => void;
  onShowArticlesChange?: (v: boolean) => void;
  onArticlesPlatformChange?: (v: 'devto' | 'hashnode') => void;
  onArticlesUsernameChange?: (v: string) => void;
  onApplyImport: (data: ImportedData) => void;
  onApplyPreset?: (presetState: Partial<GeneratorState>) => void;
}

export function EditorPanel({
  state,
  onNameChange,
  onDescriptionChange,
  onTechsChange,
  onSocialsChange,
  onSocialLinkChange,
  onGithubUsernameChange,
  onShowCommitPulseChange,
  onCommitPulseAccentChange,
  onShowSnakeGraphChange = () => {},
  onShowPacmanGraphChange = () => {},
  onGraphPlacementChange = () => {},
  onShowRepoSpotlightChange = () => {},
  onSpotlightRepoChange = () => {},
  onShowArticlesChange = () => {},
  onArticlesPlatformChange = () => {},
  onArticlesUsernameChange = () => {},
  onApplyImport,
  onApplyPreset,
}: EditorPanelProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <form
      role="form"
      aria-label="Readme Configuration Editor"
      className="flex flex-col gap-4"
      onSubmit={(e) => e.preventDefault()}
    >
      {/* GitHub Import */}
      <button
        type="button"
        onClick={() => setIsImportModalOpen(true)}
        className="w-full group relative flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 shadow-sm transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <FaGithub className="w-5 h-5 text-gray-700 dark:text-white/70 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors relative z-10" />
        <span className="text-sm font-bold text-gray-700 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white transition-colors relative z-10">
          Import from GitHub
        </span>
      </button>

      {/* Profile Presets Selector */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-500" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Profile Presets
            </h3>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-white/40">
            1-click template setup
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {PROFILE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset?.(preset.state)}
              className="flex flex-col text-left p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-sm select-none">{preset.icon}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {preset.badge}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {preset.name}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-white/40 truncate mt-0.5">
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <GitHubImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onApply={onApplyImport}
      />

      <NameSection value={state.name} onChange={onNameChange} onReset={() => onNameChange('')} />
      <DescriptionSection
        value={state.description}
        onChange={onDescriptionChange}
        onReset={() => onDescriptionChange('')}
      />
      <TechnologiesSection
        selected={state.selectedTechs}
        onChange={onTechsChange}
        onReset={() => onTechsChange([])}
      />
      <SocialsSection
        selected={state.selectedSocials}
        socialLinks={state.socialLinks}
        onSelectedChange={onSocialsChange}
        onLinkChange={onSocialLinkChange}
        onReset={() => onSocialsChange([])}
      />
      <CommitPulseSection
        githubUsername={state.githubUsername}
        showCommitPulse={state.showCommitPulse}
        commitPulseAccent={state.commitPulseAccent}
        onGithubUsernameChange={onGithubUsernameChange}
        onShowCommitPulseChange={onShowCommitPulseChange}
        onCommitPulseAccentChange={onCommitPulseAccentChange}
        onReset={() => {
          onShowCommitPulseChange(false);
          onCommitPulseAccentChange('');
        }}
      />
      <ContributionGraphSection
        githubUsername={state.githubUsername}
        showSnakeGraph={state.showSnakeGraph}
        showPacmanGraph={state.showPacmanGraph}
        graphPlacement={state.graphPlacement}
        onGithubUsernameChange={onGithubUsernameChange}
        onShowSnakeGraphChange={onShowSnakeGraphChange}
        onShowPacmanGraphChange={onShowPacmanGraphChange}
        onGraphPlacementChange={onGraphPlacementChange}
        onReset={() => {
          onShowSnakeGraphChange(false);
          onShowPacmanGraphChange(false);
          onGraphPlacementChange('bottom');
        }}
      />
      <RepoSpotlightSection
        githubUsername={state.githubUsername}
        showRepoSpotlight={state.showRepoSpotlight}
        spotlightRepo={state.spotlightRepo}
        commitPulseAccent={state.commitPulseAccent}
        onShowRepoSpotlightChange={onShowRepoSpotlightChange}
        onSpotlightRepoChange={onSpotlightRepoChange}
        onReset={() => {
          onShowRepoSpotlightChange(false);
          onSpotlightRepoChange('');
        }}
      />
      <ArticlesSection
        showArticles={state.showArticles ?? false}
        articlesPlatform={state.articlesPlatform ?? 'devto'}
        articlesUsername={state.articlesUsername ?? ''}
        onShowArticlesChange={onShowArticlesChange}
        onArticlesPlatformChange={onArticlesPlatformChange}
        onArticlesUsernameChange={onArticlesUsernameChange}
        onReset={() => {
          onShowArticlesChange(false);
          onArticlesPlatformChange('devto');
          onArticlesUsernameChange('');
        }}
      />
    </form>
  );
}
