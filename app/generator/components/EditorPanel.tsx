'use client';

import { useState } from 'react';
import { NameSection } from './sections/NameSection';
import { DescriptionSection } from './sections/DescriptionSection';
import { TechnologiesSection } from './sections/TechnologiesSection';
import { SocialsSection } from './sections/SocialsSection';
import { CommitPulseSection } from './sections/CommitPulseSection';
import { ContributionGraphSection } from './sections/ContributionGraphSection';
import { GitHubImportModal } from './GitHubImportModal';
import { FaGithub } from 'react-icons/fa';
import type { GeneratorState } from '../types';
import type { ImportedData } from '../utils/githubMapper';

interface EditorPanelProps {
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
  onApplyImport: (data: ImportedData) => void;
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
  onApplyImport,
}: EditorPanelProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setIsImportModalOpen(true)}
        className="w-full group relative flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 shadow-sm transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <FaGithub className="w-5 h-5 text-gray-700 dark:text-white/70 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors relative z-10" />
        <span className="text-sm font-bold text-gray-700 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white transition-colors relative z-10">
          Import from GitHub
        </span>
      </button>

      <GitHubImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onApply={onApplyImport}
      />

      <NameSection value={state.name} onChange={onNameChange} />
      <DescriptionSection value={state.description} onChange={onDescriptionChange} />
      <TechnologiesSection selected={state.selectedTechs} onChange={onTechsChange} />
      <SocialsSection
        selected={state.selectedSocials}
        socialLinks={state.socialLinks}
        onSelectedChange={onSocialsChange}
        onLinkChange={onSocialLinkChange}
      />
      <CommitPulseSection
        githubUsername={state.githubUsername}
        showCommitPulse={state.showCommitPulse}
        commitPulseAccent={state.commitPulseAccent}
        onGithubUsernameChange={onGithubUsernameChange}
        onShowCommitPulseChange={onShowCommitPulseChange}
        onCommitPulseAccentChange={onCommitPulseAccentChange}
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
      />
    </div>
  );
}
