'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let gsapRegistered = false;

/* ─── Types ─── */
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  desc: string;
  accent: string;
  index: number;
  accentColor: string;
}

/* ─── Floating Particle ─── */
function FloatingParticle({
  color,
  size,
  delay,
  duration,
  startX,
  startY,
}: {
  color: string;
  size: number;
  delay: number;
  duration: number;
  startX: string;
  startY: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.set(ref.current, { opacity: 0 });

    const tl = gsap.timeline({ repeat: -1, delay });
    tl.to(ref.current, {
      opacity: 0.6,
      y: -60,
      x: Math.random() * 60 - 30,
      duration: duration * 0.4,
      ease: 'power2.out',
    })
      .to(ref.current, {
        opacity: 0,
        y: -120,
        duration: duration * 0.6,
        ease: 'power1.in',
      })
      .set(ref.current, { y: 0, x: 0 });

    return () => {
      tl.kill();
    };
  }, [delay, duration]);

  return (
    <div
      ref={ref}
      className="absolute pointer-events-none rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        left: startX,
        top: startY,
        filter: `blur(${size > 4 ? 1 : 0}px)`,
        opacity: 0,
      }}
    />
  );
}

/* ─── Animated Border (Rotating Conic Gradient) ─── */
function AnimatedBorder({ color, isHovered }: { color: string; isHovered: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    if (isHovered) {
      gsap.to(ref.current, {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
      });
      tweenRef.current = gsap.to(ref.current, {
        rotation: 360,
        duration: 4,
        repeat: -1,
        ease: 'none',
      });
    } else {
      gsap.to(ref.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      });
      tweenRef.current?.kill();
    }

    return () => {
      tweenRef.current?.kill();
    };
  }, [isHovered, color]);

  return (
    <div
      ref={ref}
      className="absolute -inset-[1px] rounded-[1.75rem] pointer-events-none"
      style={{
        opacity: 0,
        background: `conic-gradient(from 0deg, transparent, ${color}, transparent, ${color}44, transparent)`,
        WebkitMaskComposite: 'xor',
        padding: '1.5px',
      }}
    />
  );
}

/* ─── Main Feature Card ─── */
export function FeatureCard({ icon, title, desc, accent, index, accentColor }: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const iconWrapRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const isHoveredRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  /* Generate particles only on client to avoid SSR hydration mismatch */
  const [particles, setParticles] = useState<
    { size: number; delay: number; duration: number; startX: string; startY: string }[]
  >([]);

  // Client-only particle generation: Math.random() must not run on the server
  // because it would produce different values than the client, causing a React
  // hydration mismatch. Generating them in a mount effect ensures SSR outputs
  // an empty array and the randomised particles only appear after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(
      Array.from({ length: 6 }, (_, i) => ({
        size: 2 + Math.random() * 4,
        delay: i * 0.8,
        duration: 3 + Math.random() * 2,
        startX: `${15 + Math.random() * 70}%`,
        startY: `${60 + Math.random() * 30}%`,
      }))
    );
  }, []);

  /* ── Scroll-triggered stagger entrance ── */
  useEffect(() => {
    if (!cardRef.current || !iconWrapRef.current || !titleRef.current || !descRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });

      tl.fromTo(
        cardRef.current,
        { y: 80, opacity: 0, scale: 0.92, rotateX: 8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotateX: 0,
          duration: 0.9,
          delay: index * 0.15,
          ease: 'power3.out',
        }
      );

      tl.fromTo(
        iconWrapRef.current,
        { scale: 0, rotation: -90, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: 'back.out(2)' },
        '-=0.4'
      );

      tl.fromTo(
        titleRef.current,
        { y: 20, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
        { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 0.5, ease: 'power3.out' },
        '-=0.3'
      );

      tl.fromTo(
        descRef.current,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
        '-=0.25'
      );
    });

    return () => ctx.revert();
  }, [index]);

  /* ── Magnetic 3D tilt + spotlight follow ── */
  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    const shine = shineRef.current;
    if (!card || !glow || !shine) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHoveredRef.current) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      gsap.to(card, {
        rotateX,
        rotateY,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 800,
      });

      gsap.to(glow, {
        x: x - rect.width / 2,
        y: y - rect.height / 2,
        opacity: 0.15,
        duration: 0.3,
        ease: 'power2.out',
      });

      gsap.to(shine, {
        x: x - 100,
        y: y - 100,
        opacity: 0.08,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      setHovered(true);

      gsap.to(card, {
        scale: 1.04,
        duration: 0.4,
        ease: 'power2.out',
      });

      if (iconWrapRef.current) {
        gsap.to(iconWrapRef.current, {
          scale: 1.15,
          rotation: 5,
          boxShadow: `0 0 30px ${accentColor}40, 0 0 60px ${accentColor}20`,
          duration: 0.4,
          ease: 'back.out(2)',
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      setHovered(false);

      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
      });

      gsap.to(glow, { opacity: 0, duration: 0.3 });
      gsap.to(shine, { opacity: 0, duration: 0.3 });

      if (iconWrapRef.current) {
        gsap.to(iconWrapRef.current, {
          scale: 1,
          rotation: 0,
          boxShadow: '0 0 0px transparent',
          duration: 0.4,
          ease: 'power2.out',
        });
      }
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [accentColor]);

  /* ── Idle floating animation on icon ── */
  useEffect(() => {
    if (!iconWrapRef.current) return;
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(iconWrapRef.current, { y: -4, duration: 2, ease: 'sine.inOut' });
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative cursor-pointer"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '800px',
        opacity: 0, // animated in by ScrollTrigger
      }}
    >
      {/* Animated rotating conic gradient border on hover */}
      <AnimatedBorder color={accentColor} isHovered={hovered} />

      <div className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white/60 p-8 shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#0a0a0a]/90 dark:shadow-2xl dark:shadow-black/50 backdrop-blur-xl transition-colors duration-300">
        {/* Spotlight glow following cursor */}
        <div
          ref={glowRef}
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 300,
            height: 300,
            background: `radial-gradient(circle, ${accentColor}40, transparent 70%)`,
            opacity: 0,
            filter: 'blur(40px)',
            transform: 'translate(-50%, -50%)',
            left: '50%',
            top: '50%',
          }}
        />

        {/* Shine reflection */}
        <div
          ref={shineRef}
          className="absolute pointer-events-none"
          style={{
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(255,255,255,0.15), transparent 60%)',
            opacity: 0,
            filter: 'blur(20px)',
            borderRadius: '50%',
          }}
        />

        {/* Background gradient blob */}
        <div
          className="absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl transition-all duration-700 group-hover:scale-150"
          style={{ background: `${accentColor}15` }}
        />

        {/* Floating particles */}
        {particles.map((p, i) => (
          <FloatingParticle key={i} color={accentColor} {...p} />
        ))}

        {/* Icon */}
        <div
          ref={iconWrapRef}
          className={`relative z-10 mb-6 w-fit rounded-2xl p-3.5 text-white shadow-lg ring-1 ring-white/10 ${accent}`}
          style={{
            background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}88)`,
            boxShadow: `0 4px 20px ${accentColor}30`,
          }}
        >
          {icon}
        </div>

        {/* Title */}
        <h3
          ref={titleRef}
          className="relative z-10 mb-3 text-lg font-bold text-gray-900 dark:text-white tracking-tight"
        >
          {title}
        </h3>

        {/* Description */}
        <p
          ref={descRef}
          className="relative z-10 text-sm leading-relaxed text-gray-600 dark:text-gray-400"
        >
          {desc}
        </p>

        {/* Bottom accent line that slides in on hover */}
        <div
          className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700 ease-out"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Section Wrapper (optional heading + background glow) ─── */
export function FeatureCardsSection({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!gsapRegistered) {
      gsap.registerPlugin(ScrollTrigger);
      gsapRegistered = true;
    }
  }, []);

  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!headingRef.current || !sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="relative">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
      </div>

      <h2
        ref={headingRef}
        className="text-center text-xs font-bold uppercase tracking-[0.3em] text-gray-400 dark:text-white/30 mb-12"
        style={{ opacity: 0 }}
      >
        Why CommitPulse?
      </h2>

      <div className="grid gap-6 md:grid-cols-3">{children}</div>
    </div>
  );
}
