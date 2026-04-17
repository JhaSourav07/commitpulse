'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FeatureCard } from './components/FeatureCard';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { BoxIcon, CheckIcon, CopyIcon, ZapIcon } from './components/Icons';
import { SuccessGuide } from './components/SuccessGuide';
import { CustomizeCTA } from './components/CustomizeCTA';

export default function LandingPage() {
  const [username, setUsername] = useState('jhasourav07');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
  }, []);

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

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-6 pb-32 md:pt-10">
        <HeroSection />

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
                    <motion.div
                      key="check"
                      initial={{ y: 10 }}
                      animate={{ y: 0 }}
                      className="flex items-center gap-2"
                    >
                      <CheckIcon /> Copied
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ y: -10 }}
                      animate={{ y: 0 }}
                      className="flex items-center gap-2"
                    >
                      <CopyIcon /> Copy Link
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative bg-[#050505] rounded-[1.5rem] overflow-hidden border border-white/10 flex items-center justify-center p-6 min-h-[350px]">
                <Image
                  src={badgeUrl}
                  alt="CommitPulse streak badge preview"
                  width={600}
                  height={420}
                  unoptimized
                  className="max-w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                />
              </div>
            </div>
          </div>
        </section>

        <div ref={guideRef}>
          <AnimatePresence>
            {copied && <SuccessGuide markdown={markdown} onDismiss={() => setCopied(false)} />}
          </AnimatePresence>
        </div>

        <CustomizeCTA />

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<ZapIcon />}
            accent="text-emerald-400"
            title="Real-time Sync"
            desc="Pulled directly from GitHub GraphQL API. Your streak updates as fast as your code pushes."
          />
          <FeatureCard
            icon={<CopyIcon />}
            accent="text-purple-400"
            title="Theme Engine"
            desc="Switch between Neon, Dracula, or custom HEX modes via simple URL management."
          />
          <FeatureCard
            icon={<BoxIcon />}
            accent="text-blue-400"
            title="Isometric Math"
            desc="Sophisticated 3D projection formulas turn 2D data into digital architecture."
          />
        </div>

        <Footer />
      </main>
    </div>
  );
}
