'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─── Testimonial Data ─── */
interface Testimonial {
  name: string;
  handle: string;
  avatar: string;
  message: string;
  platform: 'twitter' | 'github';
  accentColor: string;
}

const TESTIMONIALS_ROW_1: Testimonial[] = [
  {
    name: 'Alex Chen',
    handle: '@alexcodes',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Alex&backgroundColor=c0aede',
    message:
      'Just added CommitPulse to my GitHub README and the 3D monolith looks absolutely insane! 🔥 Way better than the flat contribution graph.',
    platform: 'twitter',
    accentColor: '#10b981',
  },
  {
    name: 'Priya Sharma',
    handle: '@priyabuilds',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Priya&backgroundColor=d1d4f9',
    message:
      'The isometric visualization is next level. My profile went from boring to absolutely premium in 30 seconds. Thank you CommitPulse! ✨',
    platform: 'twitter',
    accentColor: '#8b5cf6',
  },
  {
    name: 'Marcus Johnson',
    handle: '@marcusdev',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Marcus&backgroundColor=b6e3f4',
    message:
      'Been using CommitPulse for a month now. The real-time sync with GitHub is flawless and the theme engine has so many sick options.',
    platform: 'github',
    accentColor: '#06b6d4',
  },
  {
    name: 'Yuki Tanaka',
    handle: '@yukicodes',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Yuki&backgroundColor=ffd5dc',
    message:
      'This is what GitHub profiles should look like in 2025. CommitPulse turned my boring contribution graph into art. 🎨',
    platform: 'twitter',
    accentColor: '#f43f5e',
  },
  {
    name: 'Jordan Rivers',
    handle: '@jordandev',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Jordan&backgroundColor=c1f0c1',
    message:
      "Discovered CommitPulse through a friend's profile. Immediately set it up. The Dracula theme is *chef's kiss*.",
    platform: 'github',
    accentColor: '#10b981',
  },
  {
    name: 'Emma Rodriguez',
    handle: '@emmacodes',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Emma&backgroundColor=ffe0b2',
    message:
      'CommitPulse is the perfect motivation tool. Seeing my streak in 3D makes me want to code every single day!',
    platform: 'twitter',
    accentColor: '#f59e0b',
  },
];

const TESTIMONIALS_ROW_2: Testimonial[] = [
  {
    name: 'David Kim',
    handle: '@davidkim',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=David&backgroundColor=c0f0f0',
    message:
      'The customization studio is incredible. I spent an hour tweaking every little detail. My README has never looked this good.',
    platform: 'github',
    accentColor: '#06b6d4',
  },
  {
    name: 'Sarah Mitchell',
    handle: '@sarahcodes',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Sarah&backgroundColor=e8d5f5',
    message:
      "Okay this is literally the coolest open-source project I've seen this year. The 3D monolith on my profile gets so many compliments!",
    platform: 'twitter',
    accentColor: '#8b5cf6',
  },
  {
    name: 'Raj Patel',
    handle: '@rajbuilds',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Raj&backgroundColor=b6f4b6',
    message:
      'From flat grid to 3D masterpiece in seconds. CommitPulse is what every developer needs on their profile. 🚀',
    platform: 'twitter',
    accentColor: '#10b981',
  },
  {
    name: 'Lisa Wong',
    handle: '@lisawong',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Lisa&backgroundColor=f9d5e5',
    message:
      'I was skeptical at first, but the quality of the SVG output is remarkable. It looks perfect on any background. Highly recommend!',
    platform: 'github',
    accentColor: '#f43f5e',
  },
  {
    name: 'Omar Hassan',
    handle: '@omardev',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Omar&backgroundColor=d5e8f9',
    message:
      'The neon theme on a dark background is absolutely stunning. CommitPulse makes your GitHub profile look like a AAA game UI.',
    platform: 'twitter',
    accentColor: '#3b82f6',
  },
  {
    name: 'Chloe Nguyen',
    handle: '@chloedev',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Chloe&backgroundColor=fff5d5',
    message:
      'The dashboard feature is so cool! Watching my streak grow in real time with that beautiful 3D view is incredibly motivating. 💪',
    platform: 'github',
    accentColor: '#f59e0b',
  },
];

/* ─── Platform Icons ─── */
function TwitterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#1DA1F2]">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="text-gray-400 dark:text-gray-500"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/* ─── Star Rating ─── */
function StarRating() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="#f59e0b"
          className="drop-shadow-[0_0_3px_rgba(245,158,11,0.4)]"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Single Testimonial Card ─── */
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);

  /* Magnetic 3D tilt + cursor spotlight on hover */
  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHoveredRef.current) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      gsap.to(card, {
        rotateX,
        rotateY,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 600,
      });

      gsap.to(glow, {
        x: x - rect.width / 2,
        y: y - rect.height / 2,
        opacity: 0.12,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      gsap.to(card, { scale: 1.03, duration: 0.4, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
      });
      gsap.to(glow, { opacity: 0, duration: 0.3 });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative flex-shrink-0 w-[340px] cursor-pointer select-none"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Hover glow accent line at top */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-[2px] rounded-full opacity-0 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, ${testimonial.accentColor}, transparent)`,
        }}
      />

      <div className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white/70 p-6 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0c0c0c]/90 dark:shadow-2xl dark:shadow-black/40 transition-all duration-300 hover:border-black/10 dark:hover:border-white/15">
        {/* Spotlight glow */}
        <div
          ref={glowRef}
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 250,
            height: 250,
            background: `radial-gradient(circle, ${testimonial.accentColor}30, transparent 70%)`,
            opacity: 0,
            filter: 'blur(40px)',
            transform: 'translate(-50%, -50%)',
            left: '50%',
            top: '50%',
          }}
        />

        {/* Background gradient blob */}
        <div
          className="absolute -right-16 -top-16 h-32 w-32 rounded-full blur-3xl transition-all duration-700 group-hover:scale-150"
          style={{ background: `${testimonial.accentColor}10` }}
        />

        {/* Header: Avatar + Name + Handle */}
        <div className="relative z-10 flex items-start gap-3.5 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="h-11 w-11 rounded-full border border-black/5 bg-gray-100 dark:border-white/10 dark:bg-white/5 shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {testimonial.name}
              </p>
              {/* Verified badge */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={testimonial.accentColor}
                className="flex-shrink-0"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path
                  d="M9 12l2 2 4-4"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              {testimonial.platform === 'twitter' ? <TwitterIcon /> : <GitHubIcon />}
              <p className="text-xs text-gray-500 dark:text-gray-500">{testimonial.handle}</p>
            </div>
          </div>
        </div>

        {/* Stars */}
        <div className="relative z-10 mb-3">
          <StarRating />
        </div>

        {/* Message */}
        <p className="relative z-10 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          &ldquo;{testimonial.message}&rdquo;
        </p>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700 ease-out"
          style={{
            background: `linear-gradient(90deg, transparent, ${testimonial.accentColor}, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Infinite Marquee Row ─── */
function MarqueeRow({
  testimonials,
  direction = 'left',
  speed = 35,
}: {
  testimonials: Testimonial[];
  direction?: 'left' | 'right';
  speed?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Wait for fonts / images to settle
    const timeoutId = setTimeout(() => {
      const totalWidth = track.scrollWidth / 2; // we duplicated the content

      gsap.set(track, { x: direction === 'left' ? 0 : -totalWidth });

      tweenRef.current = gsap.to(track, {
        x: direction === 'left' ? -totalWidth : 0,
        duration: speed,
        ease: 'none',
        repeat: -1,
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      tweenRef.current?.kill();
    };
  }, [direction, speed]);

  /* Pause on hover for readability */
  const handleMouseEnter = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 0, duration: 0.5, ease: 'power2.out' });
    }
  };

  const handleMouseLeave = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 1, duration: 0.5, ease: 'power2.out' });
    }
  };

  // Duplicate cards for seamless infinite loop
  const cards = [...testimonials, ...testimonials];

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-r from-white dark:from-[#050505] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-l from-white dark:from-[#050505] to-transparent" />

      <div ref={trackRef} className="flex gap-5 py-2" style={{ width: 'max-content' }}>
        {cards.map((t, i) => (
          <TestimonialCard key={`${t.handle}-${i}`} testimonial={t} />
        ))}
      </div>
    </div>
  );
}

/* ─── Floating Glow Orb ─── */
function FloatingOrb({
  color,
  size,
  left,
  top,
  delay,
}: {
  color: string;
  size: number;
  left: string;
  top: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const tl = gsap.timeline({ repeat: -1, yoyo: true, delay });
    tl.to(ref.current, {
      y: 'random(-40, 40)',
      x: 'random(-30, 30)',
      scale: 'random(0.8, 1.3)',
      opacity: 'random(0.3, 0.7)',
      duration: 'random(4, 7)',
      ease: 'sine.inOut',
    });
    return () => {
      tl.kill();
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className="absolute pointer-events-none rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}25, transparent 70%)`,
        filter: `blur(${size / 3}px)`,
        left,
        top,
        opacity: 0.4,
      }}
    />
  );
}

/* ─── Main Wall of Love Section ─── */
export function WallOfLove() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  /* ── GSAP scroll-triggered entrance animations ── */
  useEffect(() => {
    if (
      !sectionRef.current ||
      !headingRef.current ||
      !subheadingRef.current ||
      !badgeRef.current ||
      !row1Ref.current ||
      !row2Ref.current ||
      !statsRef.current
    )
      return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });

      // Badge entrance
      tl.fromTo(
        badgeRef.current,
        { y: 30, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }
      );

      // Heading entrance with text reveal
      tl.fromTo(
        headingRef.current,
        { y: 50, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
        {
          y: 0,
          opacity: 1,
          clipPath: 'inset(0 0 0% 0)',
          duration: 0.8,
          ease: 'power3.out',
        },
        '-=0.3'
      );

      // Subheading fade in
      tl.fromTo(
        subheadingRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      );

      // Row 1 slide in
      tl.fromTo(
        row1Ref.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.3'
      );

      // Row 2 slide in
      tl.fromTo(
        row2Ref.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.5'
      );

      // Stats counter entrance
      tl.fromTo(
        statsRef.current,
        { y: 30, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.4'
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 -mx-6 overflow-hidden">
      {/* ── Background Decorations ── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.03] blur-[120px]" />
        <div className="absolute -left-[5%] top-[20%] h-[300px] w-[300px] rounded-full bg-purple-500/[0.03] blur-[100px]" />
        <div className="absolute -right-[5%] bottom-[10%] h-[350px] w-[350px] rounded-full bg-cyan-500/[0.03] blur-[100px]" />
      </div>

      {/* Floating orbs */}
      <FloatingOrb color="#10b981" size={200} left="5%" top="15%" delay={0} />
      <FloatingOrb color="#8b5cf6" size={160} left="80%" top="25%" delay={1.5} />
      <FloatingOrb color="#06b6d4" size={180} left="50%" top="70%" delay={3} />

      {/* ── Section Header ── */}
      <div className="text-center mb-16 px-6">
        {/* Badge */}
        <div ref={badgeRef} className="inline-block mb-6" style={{ opacity: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]/80 dark:text-white/70">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            </span>
            Loved by developers worldwide
          </div>
        </div>

        {/* Heading */}
        <div ref={headingRef} style={{ opacity: 0 }}>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="bg-gradient-to-br from-gray-900 via-black to-gray-600 dark:from-white dark:via-gray-100 dark:to-gray-500 bg-clip-text text-transparent">
              Wall of{' '}
            </span>
            <span className="bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Love
            </span>
            <span className="inline-block ml-2 text-4xl md:text-6xl animate-pulse">💜</span>
          </h2>
        </div>

        {/* Subheading */}
        <p
          ref={subheadingRef}
          className="mx-auto max-w-xl text-sm sm:text-base leading-relaxed text-gray-500 dark:text-white/55"
          style={{ opacity: 0 }}
        >
          See what developers are saying about CommitPulse. Real feedback from real builders who
          elevated their GitHub profiles.
        </p>
      </div>

      {/* ── Marquee Rows ── */}
      <div className="space-y-5">
        <div ref={row1Ref} style={{ opacity: 0 }}>
          <MarqueeRow testimonials={TESTIMONIALS_ROW_1} direction="left" speed={40} />
        </div>
        <div ref={row2Ref} style={{ opacity: 0 }}>
          <MarqueeRow testimonials={TESTIMONIALS_ROW_2} direction="right" speed={45} />
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div ref={statsRef} className="mt-16 px-6" style={{ opacity: 0 }}>
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-black/5 bg-white/60 backdrop-blur-xl shadow-lg shadow-black/5 dark:border-white/[0.08] dark:bg-[#0a0a0a]/80 dark:shadow-2xl dark:shadow-black/40">
            <div className="grid grid-cols-3 divide-x divide-black/5 dark:divide-white/[0.06]">
              <StatItem value="2K+" label="Happy Developers" color="#10b981" />
              <StatItem value="50K+" label="Badges Generated" color="#8b5cf6" />
              <StatItem value="4.9" label="Average Rating" color="#f59e0b" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stat Item ─── */
function StatItem({ value, label, color }: { value: string; label: string; color: string }) {
  const valueRef = useRef<HTMLParagraphElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!valueRef.current || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true); // fallback: show immediately in test/SSR env
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(valueRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="group relative px-4 py-6 text-center transition-colors duration-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
      {/* Glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 100%, ${color}10, transparent 70%)`,
        }}
      />

      <motion.p
        ref={valueRef}
        className="relative z-10 text-2xl md:text-3xl font-extrabold tracking-tight mb-1"
        style={{ color }}
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {value}
      </motion.p>
      <motion.p
        className="relative z-10 text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider"
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {label}
      </motion.p>
    </div>
  );
}
