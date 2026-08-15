'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Play,
  Pause,
  Download,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  Code,
  Layers,
  Monitor,
  Smartphone,
  Square,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

export type AspectRatioType = '9:16' | '16:9' | '1:1';
export type ThemeType = 'dark' | 'cyberpunk' | 'minimalist' | 'neobrutalism' | 'sunset';

export interface RepoReelGeneratorProps {
  initialRepoUrl?: string;
  initialCodeSnippet?: string;
}

const DEFAULT_CODE = `// Core Algorithm Spotlight
function optimizePerformance(data: CommitNode[]): MetricResult {
  const score = data.reduce((acc, curr) => {
    return acc + (curr.lines * 1.5) + (curr.prs * 3.0);
  }, 0);
  
  return {
    impact: Math.min(100, score),
    status: 'OPTIMIZED',
  };
}`;

const THEME_PRESETS: Record<
  ThemeType,
  { name: string; bg: string; text: string; accent: string; border: string }
> = {
  dark: {
    name: 'Dark Mode',
    bg: 'bg-neutral-950',
    text: 'text-zinc-100',
    accent: 'from-purple-600 to-indigo-600',
    border: 'border-neutral-800',
  },
  cyberpunk: {
    name: 'Cyberpunk',
    bg: 'bg-slate-950',
    text: 'text-cyan-300',
    accent: 'from-fuchsia-600 to-cyan-500',
    border: 'border-fuchsia-500/40',
  },
  minimalist: {
    name: 'Minimalist',
    bg: 'bg-zinc-900',
    text: 'text-zinc-200',
    accent: 'from-zinc-500 to-zinc-700',
    border: 'border-zinc-800',
  },
  neobrutalism: {
    name: 'Neobrutalism',
    bg: 'bg-amber-950',
    text: 'text-yellow-200',
    accent: 'from-yellow-500 to-orange-500',
    border: 'border-yellow-500/50',
  },
  sunset: {
    name: 'Sunset Glow',
    bg: 'bg-purple-950',
    text: 'text-rose-200',
    accent: 'from-rose-500 to-purple-600',
    border: 'border-rose-500/40',
  },
};

export default function RepoReelGenerator({
  initialRepoUrl = 'https://github.com/user/project',
  initialCodeSnippet = DEFAULT_CODE,
}: RepoReelGeneratorProps) {
  const { t } = useTranslation();

  const [repoUrl, setRepoUrl] = useState(initialRepoUrl);
  const [codeSnippet, setCodeSnippet] = useState(initialCodeSnippet);
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('9:16');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [displayedTextIndex, setDisplayedTextIndex] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [activePhase, setActivePhase] = useState<'reveal' | 'spotlight' | 'overlay'>('reveal');

  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Typing animation effect logic
  useEffect(() => {
    if (!isPlaying) return;

    animationTimerRef.current = setInterval(() => {
      setDisplayedTextIndex((prev) => {
        if (prev >= codeSnippet.length) {
          // Loop animation phases
          setActivePhase((current) => {
            if (current === 'reveal') return 'spotlight';
            if (current === 'spotlight') return 'overlay';
            return 'reveal';
          });
          return 0;
        }
        return prev + 1;
      });
    }, 40);

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, [isPlaying, codeSnippet]);

  const handleRenderExport = () => {
    setIsRendering(true);
    setRenderProgress(0);

    const interval = setInterval(() => {
      setRenderProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRendering(false);

          // Trigger simulated download of generated video reel
          const blob = new Blob([`RepoReel Video Export for ${repoUrl}`], { type: 'video/mp4' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `reporeel-${theme}-${aspectRatio.replace(':', 'x')}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const activeThemePreset = THEME_PRESETS[theme];

  // Aspect ratio class derivation
  const getAspectRatioContainerClass = () => {
    if (aspectRatio === '9:16') return 'w-[280px] h-[498px]';
    if (aspectRatio === '16:9') return 'w-[480px] h-[270px]';
    return 'w-[360px] h-[360px]';
  };

  return (
    <motion.section
      role="region"
      aria-labelledby="reporeel-title"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-gray-200/60 dark:border-neutral-800/60 shadow-2xl flex flex-col gap-6"
    >
      {/* Header Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200/50 dark:border-neutral-800/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3
              id="reporeel-title"
              className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"
            >
              {t('reporeel.title')}
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400 border border-purple-500/30">
                15s Cinematic Code-to-Video
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('reporeel.description')}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRenderExport}
          disabled={isRendering}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          {isRendering ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-purple-200" />
              <span>Rendering {renderProgress}%</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>{t('reporeel.export_button')}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player & Video Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-2xl bg-gray-950/80 border border-neutral-800 shadow-inner relative overflow-hidden min-h-[520px]">
          {/* Audio Visualization Indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? 'Mute audio' : 'Enable audio'}
              className="p-2 rounded-lg bg-neutral-900/80 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-purple-400" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Video Reel Container Box */}
          <div
            className={`relative rounded-2xl ${activeThemePreset.bg} border ${activeThemePreset.border} shadow-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between p-5 ${getAspectRatioContainerClass()}`}
          >
            {/* Top Branding Overlay */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  RepoReel • {activePhase.toUpperCase()}
                </span>
              </div>
              <div className="px-2 py-0.5 rounded bg-black/40 backdrop-blur-md text-[10px] font-mono text-purple-300 border border-purple-500/20">
                15 SEC
              </div>
            </div>

            {/* Middle Dynamic Phase Content */}
            <div className="my-auto flex flex-col items-center justify-center w-full z-10 text-center py-4">
              {activePhase === 'reveal' && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 w-full"
                >
                  {/* Isometric 3D Commit Wave Mockup */}
                  <div className="w-full h-32 flex items-end justify-center gap-1.5 p-3 rounded-xl bg-black/40 border border-white/10 backdrop-blur-sm">
                    {[35, 60, 45, 85, 95, 70, 100, 80, 65, 90].map((h, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                        className="w-full bg-gradient-to-t from-purple-600 to-cyan-400 rounded-t-sm"
                      />
                    ))}
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 mt-1">
                    Commit Growth Reveal
                  </h4>
                </motion.div>
              )}

              {activePhase === 'spotlight' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full text-left p-3 rounded-xl bg-black/70 border border-white/10 font-mono text-[11px] leading-relaxed overflow-hidden"
                >
                  <div className="text-[9px] text-zinc-500 mb-1 flex items-center gap-1">
                    <Code className="w-3 h-3 text-purple-400" />
                    <span>App.tsx Spotlight</span>
                  </div>
                  <pre className={`${activeThemePreset.text} whitespace-pre-wrap break-all`}>
                    {codeSnippet.slice(0, displayedTextIndex)}
                    <span className="animate-ping text-purple-400">|</span>
                  </pre>
                </motion.div>
              )}

              {activePhase === 'overlay' && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="p-3 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-xl">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-sm font-black text-white">Full-Stack Tech Stack</h4>
                  <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
                    {['React', 'TypeScript', 'Next.js', 'CSS3', 'Node'].map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-[10px] font-bold text-white shadow-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Controls Bar inside Preview */}
            <div className="flex items-center justify-between z-10 pt-2 border-t border-white/10">
              <span className="text-[10px] text-zinc-400 truncate max-w-[180px]">
                {repoUrl.replace('https://github.com/', '')}
              </span>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Customization Control Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Repo URL Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Repository URL
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {/* Theme Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-purple-500" />
              Cinematic Background Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(THEME_PRESETS) as ThemeType[]).map((tKey) => (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => setTheme(tKey)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    theme === tKey
                      ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold'
                      : 'border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-950/40 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <span>{THEME_PRESETS[tKey].name}</span>
                  {theme === tKey && <Check className="w-3.5 h-3.5 text-purple-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Switcher */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Aspect Ratio Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  aspectRatio === '9:16'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold'
                    : 'border-gray-200 dark:border-neutral-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>9:16 (Reel)</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  aspectRatio === '16:9'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold'
                    : 'border-gray-200 dark:border-neutral-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>16:9 (Video)</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  aspectRatio === '1:1'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold'
                    : 'border-gray-200 dark:border-neutral-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Square className="w-4 h-4" />
                <span>1:1 (Post)</span>
              </button>
            </div>
          </div>

          {/* Custom Snippet Code Editor */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Snippet Spotlight Code
              </label>
              <button
                type="button"
                onClick={() => setCodeSnippet(DEFAULT_CODE)}
                className="text-[10px] text-purple-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
            <textarea
              rows={4}
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 font-mono text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
