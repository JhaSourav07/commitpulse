'use client';

import { NameSection } from './sections/NameSection';
import { DescriptionSection } from './sections/DescriptionSection';
import { TechnologiesSection } from './sections/TechnologiesSection';
import { SocialsSection } from './sections/SocialsSection';
import { CommitPulseSection } from './sections/CommitPulseSection';
import type { GeneratorState } from '../types';

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
}: EditorPanelProps) {
  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}
