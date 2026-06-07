'use client';

import { useState, useMemo } from 'react';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { generateReadme, getEmptyReadme } from './utils/readmeGenerator';
import type { GeneratorState } from './types';

const INITIAL_STATE: GeneratorState = {
  name: '',
  description: '',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: '',
  showCommitPulse: false,
  commitPulseAccent: '',
};

export function GeneratorClient() {
  const [state, setState] = useState<GeneratorState>(INITIAL_STATE);

  const markdown = useMemo(() => {
    const hasContent =
      state.name.trim() ||
      state.description.trim() ||
      state.selectedTechs.length > 0 ||
      state.selectedSocials.some((id) => state.socialLinks[id]?.trim()) ||
      (state.showCommitPulse && state.githubUsername.trim());

    return hasContent ? generateReadme(state) : getEmptyReadme();
  }, [state]);

  return (
    <div className="flex flex-col lg:flex-row gap-5 xl:gap-6 items-start w-full">
      <div className="w-full lg:w-[44%] xl:w-[42%] flex-shrink-0">
        <EditorPanel
          state={state}
          onNameChange={(v) => setState((s) => ({ ...s, name: v }))}
          onDescriptionChange={(v) => setState((s) => ({ ...s, description: v }))}
          onTechsChange={(ids) => setState((s) => ({ ...s, selectedTechs: ids }))}
          onSocialsChange={(ids) => setState((s) => ({ ...s, selectedSocials: ids }))}
          onSocialLinkChange={(id, url) =>
            setState((s) => ({
              ...s,
              socialLinks: { ...s.socialLinks, [id]: url },
            }))
          }
          onGithubUsernameChange={(v) => setState((s) => ({ ...s, githubUsername: v }))}
          onShowCommitPulseChange={(v) => setState((s) => ({ ...s, showCommitPulse: v }))}
          onCommitPulseAccentChange={(v) => setState((s) => ({ ...s, commitPulseAccent: v }))}
        />
      </div>

      <div className="w-full lg:flex-1">
        <PreviewPanel markdown={markdown} />
      </div>
    </div>
  );
}
