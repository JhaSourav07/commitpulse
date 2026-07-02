'use client';
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useTranslation } from '@/context/TranslationContext';

export function DiscordButton() {
  const { t } = useTranslation();
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Magnetic hover effect using GSAP for smooth mouse tracking
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovered) return;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(button, {
        x: x * 0.2, // move 20% towards the mouse
        y: y * 0.2,
        rotationX: -y * 0.1,
        rotationY: x * 0.1,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 500,
      });
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      gsap.to(button, {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.3)',
      });
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isHovered]);

  return (
    <div className="relative inline-block perspective-1000">
      {/* Background Glow */}
      <motion.div
        className="absolute -inset-1 rounded-full opacity-30 blur-md bg-gradient-to-r from-[#5865F2]/50 via-purple-500/50 to-[#5865F2]/50 pointer-events-none"
        animate={{
          scale: isHovered ? 1.2 : 1,
          opacity: isHovered ? 0.8 : 0.4,
          rotate: isHovered ? 180 : 0,
        }}
        transition={{
          duration: isHovered ? 0.4 : 3,
          rotate: {
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      />

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10"
      >
        <motion.a
          ref={buttonRef}
          href="https://discord.gg/f84SDraEBH"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setIsHovered(true)}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          whileTap={{ scale: 0.95 }}
          className="relative mb-8 inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/80 backdrop-blur-md px-5 py-2 text-sm font-semibold text-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:text-black dark:border-white/10 dark:bg-[#0a0a0a]/80 dark:text-white/80 dark:hover:text-white overflow-hidden group"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Animated Sweep effect on hover */}
          <div className="absolute inset-0 translate-y-[100%] bg-gradient-to-r from-[#5865F2]/10 via-[#5865F2]/20 to-[#5865F2]/10 transition-transform duration-500 ease-out group-hover:translate-y-0" />

          {/* Pulsing Dot */}
          <span className="relative flex h-2 w-2 z-10">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5865F2] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5865F2] shadow-[0_0_8px_#5865F2]" />
          </span>

          {/* Discord Icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="z-10 text-[#5865F2] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]"
          >
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3333-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3333-.946 2.4189-2.1568 2.4189Z" />
          </svg>

          <span className="z-10 bg-gradient-to-br from-gray-900 to-gray-500 bg-clip-text text-transparent dark:from-white dark:to-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors duration-300">
            {t('landing.discord_community')}
          </span>

          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="z-10 opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[#5865F2]"
          >
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </motion.a>
      </motion.div>
    </div>
  );
}
