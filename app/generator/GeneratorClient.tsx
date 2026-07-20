'use client';

import { useState, useMemo } from 'react';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { CompletionScorePanel } from './components/CompletionScorePanel';
import { ReadmeInsightsPanel } from './components/ReadmeInsightsPanel';
import { ReadmeHealthBreakdown } from './components/ReadmeHealthBreakdown';
import { ReadmeInsight } from './components/ReadmeInsight';
import { generateReadme, getEmptyReadme } from './utils/readmeGenerator';
import type { GeneratorState } from './types';
import type { ImportedData } from './utils/githubMapper';

const INITIAL_STATE: GeneratorState = {
  name: '',
  description: '',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: '',
  showCommitPulse: false,
  commitPulseAccent: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
  showRepoSpotlight: false,
  spotlightRepo: '',
  showArticles: false,
  articlesPlatform: 'devto',
  articlesUsername: '',
};

export function GeneratorClient() {
  const [state, setState] = useState<GeneratorState>(INITIAL_STATE);

  const markdown = useMemo(() => {
    const hasContent =
      state.name.trim() ||
      state.description.trim() ||
      state.selectedTechs.length > 0 ||
      state.selectedSocials.some((id) => state.socialLinks[id]?.trim()) ||
      (state.showCommitPulse && state.githubUsername.trim()) ||
      (state.showRepoSpotlight && state.spotlightRepo.trim()) ||
      (state.showSnakeGraph && state.githubUsername.trim()) ||
      (state.showPacmanGraph && state.githubUsername.trim()) ||
      (state.showArticles && state.articlesUsername?.trim());

    return hasContent ? generateReadme(state) : getEmptyReadme();
  }, [state]);

  const handleApplyImport = (data: ImportedData) => {
    setState((prevState) => {
      let shouldAskConfirmation = false;

      if (data.name && prevState.name && prevState.name !== data.name) shouldAskConfirmation = true;
      if (data.description && prevState.description && prevState.description !== data.description)
        shouldAskConfirmation = true;

      let confirmOverwrite = false;
      if (shouldAskConfirmation) {
        confirmOverwrite = window.confirm(
          'You have existing form values. Are you sure you want to overwrite them with the imported data?'
        );
      }

      return {
        ...prevState,
        name: confirmOverwrite || !prevState.name ? data.name || prevState.name : prevState.name,
        description:
          confirmOverwrite || !prevState.description
            ? data.description || prevState.description
            : prevState.description,
        selectedTechs: Array.from(new Set([...prevState.selectedTechs, ...data.selectedTechs])),
        selectedSocials: Array.from(
          new Set([...prevState.selectedSocials, ...data.selectedSocials])
        ),
        socialLinks: { ...prevState.socialLinks, ...data.socialLinks },
      };
    });
  };

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
          onShowSnakeGraphChange={(v) => setState((s) => ({ ...s, showSnakeGraph: v }))}
          onShowPacmanGraphChange={(v) => setState((s) => ({ ...s, showPacmanGraph: v }))}
          onGraphPlacementChange={(v) => setState((s) => ({ ...s, graphPlacement: v }))}
          onShowRepoSpotlightChange={(v) => setState((s) => ({ ...s, showRepoSpotlight: v }))}
          onSpotlightRepoChange={(v) => setState((s) => ({ ...s, spotlightRepo: v }))}
          onShowArticlesChange={(v) => setState((s) => ({ ...s, showArticles: v }))}
          onArticlesPlatformChange={(v) => setState((s) => ({ ...s, articlesPlatform: v }))}
          onArticlesUsernameChange={(v) => setState((s) => ({ ...s, articlesUsername: v }))}
          onApplyImport={handleApplyImport}
        />
      </div>

      <div className="w-full lg:flex-1 flex flex-col gap-5 xl:gap-6">
        <PreviewPanel markdown={markdown} state={state} />
        <CompletionScorePanel state={state} />
        <ReadmeInsightsPanel state={state} />
        <ReadmeHealthBreakdown state={state} />
        <ReadmeInsight state={state} />
      </div>
    </div>
  );
}
