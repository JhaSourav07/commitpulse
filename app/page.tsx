"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Icons = {
  Github: () => (
    <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
  ),
  Copy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
  ),
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 L13 2 Z"/></svg>
  ),
  Box: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m7.5 4.27 9 5.15"/><path d="M3.29 7L12 12l8.71-5"/><path d="M12 22V12"/></svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  )
};

export default function LandingPage() {
  const [username, setUsername] = useState('jhasourav07');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const badgeUrl = `/api/streak?user=${username}`;
  const markdown = `![CommitPulse](https://commitpulse.vercel.app/api/streak?user=${username})`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    // 80ms gives Framer Motion time to mount the guide before scrolling
    setTimeout(() => {
      guideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    setTimeout(() => setCopied(false), 50000);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 font-sans overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-32">

        <nav className="flex justify-between items-center mb-20">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tighter">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
               <Icons.Box />
            </div>
            COMMITPULSE
          </div>
          <a 
            href="https://github.com/jhasourav07/commitpulse" 
            target="_blank" 
            className="p-2 rounded-full hover:bg-white/5 transition-colors border border-white/10"
          >
            <Icons.Github />
          </a>
        </nav>


        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-8 bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent">
              Elevate Your <br /> Contribution Story.
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Stop settling for flat grids. Generate high-fidelity, 3D isometric monoliths 
            that visualize your coding rhythm with professional precision.
          </motion.p>
        </div>


        <section className="max-w-4xl mx-auto mb-32">
          <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-4 md:p-8 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <input 
                type="text" 
                placeholder="Enter GitHub Username"
                className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 transition-all font-mono text-emerald-400 placeholder:text-white/20"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button 
                onClick={copyToClipboard}
                className="relative overflow-hidden bg-white text-black font-bold px-8 py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-w-[200px]"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div key="check" initial={{ y: 10 }} animate={{ y: 0 }} className="flex items-center gap-2">
                      <Icons.Check /> Copied
                    </motion.div>
                  ) : (
                    <motion.div key="copy" initial={{ y: -10 }} animate={{ y: 0 }} className="flex items-center gap-2">
                      <Icons.Copy /> Copy Link
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>


            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative bg-[#050505] rounded-[1.5rem] overflow-hidden border border-white/10 flex items-center justify-center p-6 min-h-[350px]">
                 <img 
                   src={badgeUrl} 
                   alt="Preview" 
                   className="max-w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400/050505/ffffff?text=User+Not+Found';
                   }}
                 />
              </div>
            </div>
          </div>
        </section>


        <div ref={guideRef}>
          <AnimatePresence>
            {copied && (
              <SuccessGuide markdown={markdown} onDismiss={() => setCopied(false)} />
            )}
          </AnimatePresence>
        </div>


        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Icons.Zap />} 
            accent="text-emerald-400"
            title="Real-time Sync" 
            desc="Pulled directly from GitHub GraphQL API. Your streak updates as fast as your code pushes."
          />
          <FeatureCard 
            icon={<Icons.Copy />} 
            accent="text-purple-400"
            title="Theme Engine" 
            desc="Switch between Neon, Dracula, or custom HEX modes via simple URL management."
          />
          <FeatureCard 
            icon={<Icons.Box />} 
            accent="text-blue-400"
            title="Isometric Math" 
            desc="Sophisticated 3D projection formulas turn 2D data into digital architecture."
          />
        </div>


        <footer className="mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-white/30">
          <p>© 2026 CommitPulse. Designed for the elite builder community.</p>
          <div className="flex gap-8">
            <Link href="/documentation" className="hover:text-white transition-colors">Documentation</Link>
            <a href="https://github.com/jhasourav07" className="hover:text-white transition-colors">Creator</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc, accent }: { icon: any, title: string, desc: string, accent: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-10 bg-[#0f0f0f] border border-white/5 rounded-[2rem] hover:border-white/20 transition-all group"
    >
      <div className={`mb-6 p-3 w-fit rounded-xl bg-white/5 ${accent}`}>{icon}</div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-emerald-400 transition-colors uppercase tracking-widest text-sm">{title}</h3>
      <p className="text-gray-500 leading-relaxed font-medium">{desc}</p>
    </motion.div>
  );
}



const STEPS = [
  {
    n: '01',
    title: 'Open Your Profile Repo',
    body: 'Navigate to github.com/YOUR_USERNAME/YOUR_USERNAME — your special profile repository.',
  },
  {
    n: '02',
    title: 'Edit README.md',
    body: 'Click the pencil icon to open the file in GitHub\'s built-in editor.',
  },
  {
    n: '03',
    title: 'Paste the Snippet',
    body: 'Place your cursor wherever you want the monolith to appear, then paste (Ctrl+V / ⌘V).',
  },
  {
    n: '04',
    title: 'Save & Ship It',
    body: 'Click "Commit changes" and visit your profile. Your 3D streak is now live.',
  },
];

function SuccessGuide({ markdown, onDismiss }: { markdown: string; onDismiss: () => void }) {
  return (
    <motion.div
      key="success-guide"
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="max-w-4xl mx-auto mb-12"
    >

      <div
        className="relative rounded-[2rem] border border-emerald-500/20 bg-[#050505]/80 backdrop-blur-2xl overflow-hidden"
        style={{ boxShadow: '0 0 60px -10px rgba(16,185,129,0.15), 0 0 0 1px rgba(16,185,129,0.08) inset' }}
      >
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />


        <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">

            <span className="relative flex h-3 w-3 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-0.5">
                Markdown Copied
              </p>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Your Monolith is Ready — Deploy It in 4 Steps
              </h2>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="ml-4 mt-1 shrink-0 p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Dismiss guide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>


        <div className="grid sm:grid-cols-2 gap-px bg-white/5 border-b border-white/5">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className="bg-[#050505] p-6 flex gap-4"
            >

              <span className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center tracking-widest">
                {step.n}
              </span>
              <div>
                <p className="font-bold text-white text-sm mb-1">{step.title}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>


        <div className="px-8 py-6">
          <p className="text-xs uppercase tracking-[0.15em] text-white/30 font-bold mb-3">
            Your copied snippet
          </p>
          <div className="flex items-center gap-3 bg-black/60 border border-white/8 rounded-xl px-4 py-3 font-mono text-sm">
            <span className="text-emerald-400/60 select-none shrink-0">$</span>
            <code className="text-emerald-300 break-all leading-relaxed flex-1 overflow-x-auto">
              {markdown}
            </code>
          </div>
          <p className="mt-4 text-xs text-white/25 leading-relaxed">
            Tip: Add <code className="text-white/40">?theme=neon</code> or <code className="text-white/40">?accent=ff6b35</code> to the URL to change your monolith's colour palette.
          </p>
        </div>
      </div>
    </motion.div>
  );
}