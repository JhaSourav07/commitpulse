'use client';

import { copyToClipboard } from '@/utils/clipboard';
import { useState, useEffect } from 'react';
import {
  Loader2,
  Search,
  X,
  ExternalLink,
  Info,
  Copy,
  Check,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SectionCard, FieldLabel } from '../SectionCard';
import { validateGitHubUsername } from '@/lib/validations';
import { useDebounce } from '@/hooks/useDebounce';
import { useGitHubUserExists } from '@/hooks/useGitHubUserExists';
import {
  generateWorkflowYaml,
  generateReadmeSnippet,
  getWorkflowFilename,
  getPlacementHint,
  type GraphKind,
} from '@/lib/snakeWorkflowGenerator';
import { SNAKE_SAMPLE_PREVIEW_SRC, PACMAN_SAMPLE_PREVIEW_SRC } from '@/lib/samplePreviewGraphs';

export interface ContributionGraphSectionProps {
  githubUsername: string;
  showSnakeGraph: boolean;
  showPacmanGraph: boolean;
  graphPlacement: 'top' | 'middle' | 'bottom';
  onGithubUsernameChange: (v: string) => void;
  onShowSnakeGraphChange: (v: boolean) => void;
  onShowPacmanGraphChange: (v: boolean) => void;
  onGraphPlacementChange: (v: 'top' | 'middle' | 'bottom') => void;
}

export function ContributionGraphSection({
  githubUsername,
  showSnakeGraph,
  showPacmanGraph,
  graphPlacement,
  onGithubUsernameChange,
  onShowSnakeGraphChange,
  onShowPacmanGraphChange,
  onGraphPlacementChange,
}: ContributionGraphSectionProps) {
  const safeUsername = githubUsername || '';
  const trimmed = safeUsername.trim();
  const debouncedUsername = useDebounce(trimmed, 500);

  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsTab, setInstructionsTab] = useState<'snake' | 'pacman'>('snake');
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [copiedReadme, setCopiedReadme] = useState(false);

  const { status: usernameExistsStatus } = useGitHubUserExists(debouncedUsername);

  const [snakeLoaded, setSnakeLoaded] = useState(false);
  const [snakeError, setSnakeError] = useState(false);
  const [pacmanLoaded, setPacmanLoaded] = useState(false);
  const [pacmanError, setPacmanError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnakeLoaded(false);

    setSnakeError(false);

    setPacmanLoaded(false);

    setPacmanError(false);
  }, [debouncedUsername]);

  const snakeUrl = debouncedUsername
    ? `https://raw.githubusercontent.com/${debouncedUsername}/${debouncedUsername}/output/github-snake.svg`
    : null;

  const pacmanUrl = debouncedUsername
    ? `https://raw.githubusercontent.com/${debouncedUsername}/${debouncedUsername}/output/pacman-contribution-graph.svg`
    : null;

  // Fall back to a placeholder so the code blocks always render something
  // sensible even before a valid username is entered.
  const usernameForCode = debouncedUsername || 'your-username';

  const snakeWorkflow = generateWorkflowYaml('snake', usernameForCode);
  const pacmanWorkflow = generateWorkflowYaml('pacman', usernameForCode);
  const snakeReadmeSnippet = generateReadmeSnippet('snake', usernameForCode);
  const pacmanReadmeSnippet = generateReadmeSnippet('pacman', usernameForCode);

  const activeWorkflow = instructionsTab === 'snake' ? snakeWorkflow : pacmanWorkflow;
  const activeReadmeSnippet =
    instructionsTab === 'snake' ? snakeReadmeSnippet : pacmanReadmeSnippet;
  const activeWorkflowFilename = getWorkflowFilename(instructionsTab as GraphKind);
  const activePlacementHint = getPlacementHint(graphPlacement);

  const handleCopyWorkflow = async (text: string) => {
    try {
      await copyToClipboard(text);
      setCopiedWorkflow(true);
      setTimeout(() => setCopiedWorkflow(false), 2000);
    } catch {
      // Fallback if clipboard fails
    }
  };

  const handleCopyReadme = async (text: string) => {
    try {
      await copyToClipboard(text);
      setCopiedReadme(true);
      setTimeout(() => setCopiedReadme(false), 2000);
    } catch {
      // Fallback if clipboard fails
    }
  };

  const activeCount = (showSnakeGraph ? 1 : 0) + (showPacmanGraph ? 1 : 0);

  return (
    <SectionCard
      title="Contribution Visualizations"
      description="Add animated Snake/Pacman contribution graphs to your README"
      defaultOpen={false}
      badge={activeCount}
    >
      <div className="flex flex-col gap-5">
        {/* Toggle Snake Graph */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-white/70">
              Snake Contribution Graph
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5">
              Generates a classic Snake game animation over your grid
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showSnakeGraph}
            aria-label="Toggle Snake Graph"
            onClick={() => {
              const nextVal = !showSnakeGraph;
              onShowSnakeGraphChange(nextVal);
              if (nextVal) {
                onShowPacmanGraphChange(false);
                setInstructionsTab('snake');
              }
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
              showSnakeGraph ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showSnakeGraph ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle Pacman Graph */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-white/70">
              Pacman Contribution Graph
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5">
              Generates a retro Pacman animation over your grid
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showPacmanGraph}
            aria-label="Toggle Pacman Graph"
            onClick={() => {
              const nextVal = !showPacmanGraph;
              onShowPacmanGraphChange(nextVal);
              if (nextVal) {
                onShowSnakeGraphChange(false);
                setInstructionsTab('pacman');
              }
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
              showPacmanGraph ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showPacmanGraph ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sub-options if any graph is selected */}
        {(showSnakeGraph || showPacmanGraph) && (
          <div className="flex flex-col gap-4 border-t border-gray-100 dark:border-white/5 pt-4">
            {/* GitHub Username Input */}
            <div>
              <FieldLabel>GitHub Username</FieldLabel>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 dark:text-white/25 pointer-events-none">
                  <Search size={14} />
                </span>
                <input
                  aria-label="GitHub username"
                  type="text"
                  value={safeUsername}
                  onChange={(e) => onGithubUsernameChange(e.target.value.trim())}
                  placeholder="e.g. John"
                  maxLength={39}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="contribution-graph-username-status"
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 pl-9 pr-9 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
                />
                <span className="absolute right-3 flex items-center">
                  {safeUsername.length > 0 && usernameExistsStatus === 'checking' && (
                    <Loader2
                      size={14}
                      className="animate-spin text-gray-400 dark:text-white/30"
                      aria-label="Checking username"
                    />
                  )}
                  {safeUsername.length > 0 && usernameExistsStatus !== 'checking' && (
                    <button
                      type="button"
                      onClick={() => onGithubUsernameChange('')}
                      aria-label="Clear username"
                      className="text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white/70 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              </div>

              <div id="contribution-graph-username-status">
                {trimmed.length > 0 && !validateGitHubUsername(trimmed) && (
                  <p className="mt-2 text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    Invalid username format.
                  </p>
                )}

                {trimmed.length > 0 &&
                  validateGitHubUsername(trimmed) &&
                  usernameExistsStatus === 'exists' && (
                    <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="flex-shrink-0" />
                      GitHub user found — workflow and README snippet generated below.
                    </p>
                  )}

                {trimmed.length > 0 &&
                  validateGitHubUsername(trimmed) &&
                  usernameExistsStatus === 'not_found' && (
                    <p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="flex-shrink-0" />
                      No GitHub user named &ldquo;{trimmed}&rdquo; was found.
                    </p>
                  )}

                {trimmed.length > 0 &&
                  validateGitHubUsername(trimmed) &&
                  usernameExistsStatus === 'unverifiable' && (
                    <p className="mt-2 text-xs text-gray-400 dark:text-white/40 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="flex-shrink-0" />
                      Couldn&apos;t verify this username right now — showing generated code anyway.
                    </p>
                  )}
              </div>
            </div>

            {/* Position Picker */}
            <div>
              <FieldLabel>Placement Location</FieldLabel>
              <div className="flex rounded-xl bg-gray-100 dark:bg-white/5 p-1 gap-1 w-full">
                {(['top', 'middle', 'bottom'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => onGraphPlacementChange(pos)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                      graphPlacement === pos
                        ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Setup Instructions Helper Toggle */}
            <div
              className={`rounded-xl border p-3.5 transition-all duration-500 ${
                showInstructions
                  ? 'border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]'
                  : 'border-emerald-500/40 dark:border-emerald-500/35 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] shadow-sm shadow-emerald-500/5 hover:border-emerald-500/60 dark:hover:border-emerald-500/50'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowInstructions((v) => !v)}
                className="flex items-center justify-between w-full text-left group"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Info
                      size={14}
                      className="text-emerald-500 group-hover:scale-110 transition-transform"
                    />
                    {!showInstructions && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold transition-colors ${
                      showInstructions
                        ? 'text-gray-700 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white'
                        : 'text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
                    }`}
                  >
                    {trimmed.length > 0
                      ? 'Your workflow + README code is ready'
                      : 'How do I set this up on GitHub?'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-emerald-500 group-hover:text-emerald-400 transition-colors">
                    {showInstructions ? 'Hide details' : 'Show details'}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-emerald-500 transition-transform duration-300 ${
                      showInstructions ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  showInstructions
                    ? 'grid-rows-[1fr] opacity-100 mt-3.5 border-t border-gray-200 dark:border-white/5 pt-3.5'
                    : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="mb-3 text-xs text-gray-500 dark:text-white/40 leading-relaxed">
                    These contribution graphs are generated automatically via GitHub Actions in a
                    repository matching your username (e.g.,{' '}
                    <code className="px-1.5 py-0.5 rounded bg-gray-200/50 dark:bg-white/10 font-mono text-[11px] text-gray-700 dark:text-white/80">
                      {trimmed || 'username'}/{trimmed || 'username'}
                    </code>
                    ).
                  </p>

                  <ol className="list-decimal list-inside space-y-2 mb-4 text-xs text-gray-500 dark:text-white/40 leading-relaxed">
                    <li>
                      Create a public repository named exactly{' '}
                      <strong className="text-gray-700 dark:text-white/70">
                        {trimmed || 'your-username'}
                      </strong>{' '}
                      if you haven&apos;t already.
                    </li>
                    <li>
                      Inside that repository, create a directory path:{' '}
                      <code className="px-1.5 py-0.5 rounded bg-gray-200/50 dark:bg-white/10 font-mono text-[11px] text-gray-700 dark:text-white/80">
                        .github/workflows/
                      </code>
                    </li>
                    <li>
                      Create a file named{' '}
                      <code className="px-1.5 py-0.5 rounded bg-gray-200/50 dark:bg-white/10 font-mono text-[11px] text-gray-700 dark:text-white/80">
                        {activeWorkflowFilename}
                      </code>{' '}
                      and copy-paste the workflow configuration below.
                    </li>
                    <li>
                      Push the commit, then run the workflow once manually from the
                      &ldquo;Actions&rdquo; tab in your repo (or wait for the daily schedule).
                    </li>
                    <li>
                      Paste the README snippet below into your{' '}
                      <code className="px-1.5 py-0.5 rounded bg-gray-200/50 dark:bg-white/10 font-mono text-[11px] text-gray-700 dark:text-white/80">
                        README.md
                      </code>
                      . {activePlacementHint}
                    </li>
                  </ol>

                  {/* Workflow Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-white/5 mb-3 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setInstructionsTab('snake')}
                      className={`px-3 py-1.5 text-[11px] font-bold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                        instructionsTab === 'snake'
                          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-white/60'
                      }`}
                    >
                      Snake Workflow
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstructionsTab('pacman')}
                      className={`px-3 py-1.5 text-[11px] font-bold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                        instructionsTab === 'pacman'
                          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-white/60'
                      }`}
                    >
                      Pacman Workflow
                    </button>
                  </div>

                  {/* Workflow Code Block */}
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">
                    .github/workflows/{activeWorkflowFilename}
                  </p>
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/8 bg-[#0a0a0a] p-3 font-mono text-[10px] text-white/70 max-h-[220px] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => handleCopyWorkflow(activeWorkflow)}
                      className="absolute right-2.5 top-2.5 p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Copy workflow to clipboard"
                    >
                      {copiedWorkflow ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                    <pre className="whitespace-pre overflow-x-auto pr-8">{activeWorkflow}</pre>
                  </div>

                  {/* README Snippet Code Block */}
                  <p className="mt-4 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">
                    README.md snippet
                  </p>
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/8 bg-[#0a0a0a] p-3 font-mono text-[10px] text-white/70 max-h-[180px] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => handleCopyReadme(activeReadmeSnippet)}
                      className="absolute right-2.5 top-2.5 p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Copy README snippet to clipboard"
                    >
                      {copiedReadme ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                    <pre className="whitespace-pre overflow-x-auto pr-8">{activeReadmeSnippet}</pre>
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/30">
                    {activePlacementHint}
                  </p>
                </div>
              </div>
            </div>

            {/* Visualizations Live Preview */}
            {trimmed && validateGitHubUsername(trimmed) && (
              <div className="flex flex-col gap-3.5 border-t border-gray-100 dark:border-white/5 pt-4">
                <FieldLabel>Live Preview</FieldLabel>

                {showSnakeGraph && snakeUrl && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-600 dark:text-white/50">
                        Snake Contribution Graph
                      </span>
                      <a
                        href={`https://github.com/${debouncedUsername}/${debouncedUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-[10px] text-emerald-500 hover:underline font-semibold"
                      >
                        Visit Repository <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="relative rounded-xl border border-gray-200 dark:border-white/8 bg-[#0d1117] p-3 flex items-center justify-center min-h-[100px] overflow-hidden">
                      {!snakeLoaded && !snakeError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 size={20} className="animate-spin text-zinc-600" />
                        </div>
                      )}
                      {snakeError && (
                        <div className="flex flex-col items-center gap-2 w-full">
                          <span className="absolute left-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/70">
                            Sample preview
                          </span>
                          <img
                            src={SNAKE_SAMPLE_PREVIEW_SRC}
                            alt="Sample illustration of a Snake Contribution Graph"
                            className="w-full h-auto max-w-[400px] opacity-90"
                          />
                          <p className="text-[11px] text-gray-400 text-center px-4">
                            This is a sample — your live graph for{' '}
                            <strong className="text-gray-300">{debouncedUsername}</strong>{' '}
                            isn&apos;t available yet. Set up the Action below to load your real
                            data.
                          </p>
                        </div>
                      )}
                      <img
                        src={snakeUrl}
                        alt={`Snake Contribution Graph for ${debouncedUsername}`}
                        className={`w-full h-auto max-w-[400px] transition-opacity duration-300 ${
                          snakeLoaded ? 'opacity-100' : 'opacity-0 absolute'
                        }`}
                        onLoad={() => {
                          setSnakeLoaded(true);
                          setSnakeError(false);
                        }}
                        onError={() => {
                          setSnakeError(true);
                          setSnakeLoaded(false);
                        }}
                      />
                    </div>
                  </div>
                )}

                {showPacmanGraph && pacmanUrl && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-600 dark:text-white/50">
                        Pacman Contribution Graph
                      </span>
                      <a
                        href={`https://github.com/${debouncedUsername}/${debouncedUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-[10px] text-emerald-500 hover:underline font-semibold"
                      >
                        Visit Repository <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="relative rounded-xl border border-gray-200 dark:border-white/8 bg-[#0d1117] p-3 flex items-center justify-center min-h-[100px] overflow-hidden">
                      {!pacmanLoaded && !pacmanError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 size={20} className="animate-spin text-zinc-600" />
                        </div>
                      )}
                      {pacmanError && (
                        <div className="flex flex-col items-center gap-2 w-full">
                          <span className="absolute left-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/70">
                            Sample preview
                          </span>
                          <img
                            src={PACMAN_SAMPLE_PREVIEW_SRC}
                            alt="Sample illustration of a Pacman Contribution Graph"
                            className="w-full h-auto max-w-[400px] opacity-90"
                          />
                          <p className="text-[11px] text-gray-400 text-center px-4">
                            This is a sample — your live graph for{' '}
                            <strong className="text-gray-300">{debouncedUsername}</strong>{' '}
                            isn&apos;t available yet. Set up the Action below to load your real
                            data.
                          </p>
                        </div>
                      )}
                      <img
                        src={pacmanUrl}
                        alt={`Pacman Contribution Graph for ${debouncedUsername}`}
                        className={`w-full h-auto max-w-[400px] transition-opacity duration-300 ${
                          pacmanLoaded ? 'opacity-100' : 'opacity-0 absolute'
                        }`}
                        onLoad={() => {
                          setPacmanLoaded(true);
                          setPacmanError(false);
                        }}
                        onError={() => {
                          setPacmanError(true);
                          setPacmanLoaded(false);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
