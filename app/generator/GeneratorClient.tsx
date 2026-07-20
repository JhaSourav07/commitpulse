'use client';

import { useState, useMemo } from 'react';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { CompletionScorePanel } from './components/CompletionScorePanel';
import { ReadmeInsightsPanel } from './components/ReadmeInsightsPanel';
import { ReadmeHealthBreakdown } from './components/ReadmeHealthBreakdown';
import { ReadmeInsight } from './components/ReadmeInsight';
import { generateReadme, getEmptyReadme } from './utils/readmeGenerator';
import { sanitizeSocialUrl } from './utils/urlSanitizer';
import type { GeneratorState } from './types';
import type { ImportedData } from './utils/githubMapper';
import { SupportedLanguage } from '@/lib/i18n/languages';

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
  const [language, setLanguage] = useState<SupportedLanguage>('en');

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

    return hasContent ? generateReadme(state, language) : getEmptyReadme();
  }, [state, language]);

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
        selectedTechs: Array.from(
          new Set([...prevState.selectedTechs, ...(data.selectedTechs || [])])
        ),
        selectedSocials: Array.from(
          new Set([...prevState.selectedSocials, ...(data.selectedSocials || [])])
        ),
        socialLinks: { ...prevState.socialLinks, ...data.socialLinks },
      };
    });
  };

  const handleApplyPreset = (presetState: Partial<GeneratorState>) => {
    setState((prevState) => ({
      ...prevState,
      ...presetState,
    }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 xl:gap-6 items-start w-full">
      {/* Language Selector - Top of the page */}
      <div className="w-full flex justify-end items-center gap-3 mb-2">
        <label htmlFor="language" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          🌐 Language:
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
        >
          <option value="en">🇺🇸 English</option>
          <option value="es">🇪🇸 Español</option>
          <option value="ja">🇯🇵 日本語</option>
        </select>
      </div>

      <div className="w-full lg:w-[44%] xl:w-[42%] flex-shrink-0">
        <EditorPanel
          state={state}
          onNameChange={(v) => setState((s) => ({ ...s, name: v }))}
          onDescriptionChange={(v) => setState((s) => ({ ...s, description: v }))}
          onTechsChange={(ids) =>
            setState((s) => ({ ...s, selectedTechs: Array.from(new Set(ids)) }))
          }
          onSocialsChange={(ids) =>
            setState((s) => ({ ...s, selectedSocials: Array.from(new Set(ids)) }))
          }
          onSocialLinkChange={(id, url) =>
            setState((s) => ({
              ...s,
              socialLinks: { ...s.socialLinks, [id]: sanitizeSocialUrl(id, url) },
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
          onApplyPreset={handleApplyPreset}
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
