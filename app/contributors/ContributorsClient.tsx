'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Globe, Sparkles, Users, GitPullRequest, ArrowRight, GitFork } from 'lucide-react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import ContributorsSearch from './ContributorsSearch';
import Leaderboard from '@/components/Leaderboard';
import { Footer } from '@/app/components/Footer';

interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

interface ContributorsClientProps {
  contributors: Contributor[];
  totalContributions: number;
  topContributors: Contributor[];
}

// ── Custom Hooks ──

// Animated Counter
function AnimatedCounter({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 40, stiffness: 50 });
  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);
  const displayValue = useTransform(springValue, (current) => Math.round(current));
  return <motion.span>{displayValue}</motion.span>;
}

// Magnetic Effect Component
function MagneticButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function ContributorsClient({
  contributors,
  totalContributions,
  topContributors,
}: ContributorsClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Custom Cursor Logic
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove);

    const render = () => {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      if (cursor) {
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      }
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  // GSAP ScrollTrigger Logic
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Smooth reveal for stats
    gsap.fromTo(
      '.stat-item',
      { opacity: 0, y: 100, rotationX: -30 },
      {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 80%',
        },
      }
    );

    // Parallax background grid
    gsap.to('.bg-grid', {
      y: '30%',
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 overflow-hidden font-sans"
    >
      {/* ── Custom Cursor ── */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full bg-white mix-blend-difference pointer-events-none z-[100] -ml-4 -mt-4 hidden md:block"
        style={{ transition: 'width 0.2s, height 0.2s' }}
      />

      {/* ── Extreme Background Effects ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grain Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] bg-repeat" />

        {/* Animated Grid */}
        <div className="bg-grid absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[150px]" />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10" ref={contentRef}>
        {/* ── Hero Section (Pinned/Sticky Style) ── */}
        <section
          ref={heroRef}
          className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pt-20 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md"
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
              The Architect Collective
            </span>
          </motion.div>

          <div className="perspective-1000">
            <motion.h1
              initial={{ opacity: 0, rotateX: 20, y: 50 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-6xl text-6xl font-black leading-[0.9] tracking-tighter sm:text-7xl md:text-8xl lg:text-[10rem]"
            >
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                BUILDING
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 pb-4">
                COMMITPULSE
              </span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
            className="mt-8 max-w-2xl text-lg md:text-xl text-zinc-400 font-light"
          >
            Meet the elite developers shaping the future of GitHub visualization through open-source
            mastery and relentless innovation.
          </motion.p>

          <MagneticButton className="mt-12">
            <a
              href="#explore"
              className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-black font-semibold transition-transform hover:scale-105 active:scale-95 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Explore The Elite{' '}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </a>
          </MagneticButton>
        </section>

        <div id="explore" className="h-24" />

        {/* ── Stats Section ── */}
        <section ref={statsRef} className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-item group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-10 backdrop-blur-3xl hover:bg-white/[0.04] transition-colors duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Users className="h-10 w-10 text-cyan-400 mb-6" />
              <div className="text-6xl font-black tracking-tighter mb-2">
                <AnimatedCounter value={contributors.length} />+
              </div>
              <div className="text-zinc-500 uppercase tracking-widest text-sm font-semibold">
                Global Architects
              </div>
            </div>

            <div className="stat-item group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-10 backdrop-blur-3xl hover:bg-white/[0.04] transition-colors duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <GitPullRequest className="h-10 w-10 text-purple-400 mb-6" />
              <div className="text-6xl font-black tracking-tighter mb-2">
                <AnimatedCounter value={totalContributions} />+
              </div>
              <div className="text-zinc-500 uppercase tracking-widest text-sm font-semibold">
                Total Commits
              </div>
            </div>

            <div className="stat-item group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-10 backdrop-blur-3xl hover:bg-white/[0.04] transition-colors duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Globe className="h-10 w-10 text-blue-400 mb-6" />
              <div className="text-6xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                OSS
              </div>
              <div className="text-zinc-500 uppercase tracking-widest text-sm font-semibold">
                Community Driven
              </div>
            </div>
          </div>
        </section>

        {/* ── Leaderboard Section ── */}
        <section className="mx-auto mt-40 max-w-7xl px-6">
          <div className="mb-20">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">THE VANGUARD</h2>
            <p className="mt-4 text-xl text-zinc-500 max-w-2xl font-light">
              The highest impact contributors pushing the boundaries of what is possible.
            </p>
          </div>
          <Leaderboard contributors={topContributors} />
        </section>

        {/* ── All Contributors Grid ── */}
        <section className="mx-auto mt-40 max-w-7xl px-6">
          <div className="mb-20">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">THE COLLECTIVE</h2>
            <p className="mt-4 text-xl text-zinc-500 max-w-2xl font-light">
              Every single mind that has contributed code, ideas, and passion to the project.
            </p>
          </div>
          <ContributorsSearch contributors={contributors} />
        </section>

        {/* ── CTA Section ── */}
        <section className="mx-auto mt-40 mb-20 max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-white/[0.02] p-16 text-center backdrop-blur-3xl shadow-2xl">
            {/* Inner Glows */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/30 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/30 blur-[100px] rounded-full pointer-events-none" />

            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              READY TO BUILD?
            </h2>
            <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto font-light">
              Join the elite collective of developers. Your next great contribution starts here.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <MagneticButton>
                <Link
                  href="https://github.com/JhaSourav07/commitpulse"
                  target="_blank"
                  className="group relative inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 font-bold text-black transition-transform hover:scale-105 active:scale-95"
                >
                  <GitFork className="h-6 w-6" />
                  View Repository
                </Link>
              </MagneticButton>

              <MagneticButton>
                <Link
                  href="https://github.com/JhaSourav07/commitpulse/issues"
                  target="_blank"
                  className="group relative inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-10 py-5 font-bold text-white transition-colors hover:bg-white/10 hover:border-white/40 backdrop-blur-md"
                >
                  Start Contributing{' '}
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </MagneticButton>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 pb-12">
          <Footer />
        </div>
      </div>
    </div>
  );
}
