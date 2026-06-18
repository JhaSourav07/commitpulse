'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── config ───────────────────────────────────────────────────────────── */

const SECRET_CODE = 'commit';
const DISPLAY_DURATION = 6000; // ms the whole show lasts
const MATRIX_CHAR_COUNT = 80;
const CONFETTI_COUNT = 60;

/* ── helper: random ───────────────────────────────────────────────────── */

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const MATRIX_CHARS =
  '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const CONFETTI_COLORS = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ec4899', // pink
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f43f5e', // rose
];

/* ── types for pre-computed data ──────────────────────────────────────── */

interface MatrixDropData {
  id: number;
  left: number;
  delay: number;
  chars: { char: string; fontSize: number }[];
  duration: number;
}

interface ConfettiPieceData {
  id: number;
  delay: number;
  color: string;
  size: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rotation: number;
  isCircle: boolean;
  duration: number;
}

/* ── matrix rain column ───────────────────────────────────────────────── */

function MatrixDrop({ data }: { data: MatrixDropData }) {
  return (
    <motion.div
      initial={{ y: '-100%', opacity: 0 }}
      animate={{ y: '110vh', opacity: [0, 1, 1, 0.3] }}
      transition={{
        duration: data.duration,
        delay: data.delay,
        ease: 'linear',
      }}
      className="absolute top-0 flex flex-col items-center pointer-events-none select-none"
      style={{ left: `${data.left}%` }}
    >
      {data.chars.map((c, i) => (
        <span
          key={i}
          className="block leading-none"
          style={{
            color: i === 0 ? '#fff' : `rgba(16, 185, 129, ${1 - i * 0.06})`,
            fontSize: `${c.fontSize}px`,
            fontFamily: 'monospace',
            textShadow:
              i === 0
                ? '0 0 12px rgba(16,185,129,0.9), 0 0 30px rgba(16,185,129,0.4)'
                : '0 0 6px rgba(16,185,129,0.3)',
          }}
        >
          {c.char}
        </span>
      ))}
    </motion.div>
  );
}

/* ── confetti particle ────────────────────────────────────────────────── */

function ConfettiPiece({ data }: { data: ConfettiPieceData }) {
  return (
    <motion.div
      initial={{
        x: `${data.startX}vw`,
        y: `${data.startY}vh`,
        opacity: 1,
        scale: 0,
        rotate: 0,
      }}
      animate={{
        x: `${data.endX}vw`,
        y: `${data.endY}vh`,
        opacity: [1, 1, 0],
        scale: [0, 1.2, 0.8],
        rotate: data.rotation,
      }}
      transition={{
        duration: data.duration,
        delay: data.delay,
        ease: 'easeOut',
      }}
      className="absolute pointer-events-none"
      style={{
        width: data.size,
        height: data.isCircle ? data.size : data.size * 0.4,
        borderRadius: data.isCircle ? '50%' : '2px',
        backgroundColor: data.color,
        boxShadow: `0 0 6px ${data.color}`,
      }}
    />
  );
}

/* ── pre-compute all random data ──────────────────────────────────────── */

function generateMatrixDrops(count: number = MATRIX_CHAR_COUNT): MatrixDropData[] {
  return Array.from({ length: count }, (_, i) => {
    const len = Math.floor(rand(8, 22));
    return {
      id: i,
      left: rand(0, 100),
      delay: rand(0, 2.5),
      duration: rand(2.5, 5),
      chars: Array.from({ length: len }, () => ({
        char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
        fontSize: rand(10, 16),
      })),
    };
  });
}

function generateConfettiPieces(count: number = CONFETTI_COUNT): ConfettiPieceData[] {
  return Array.from({ length: count }, (_, i) => {
    const startX = rand(20, 80);
    const startY = rand(30, 50);
    return {
      id: i,
      delay: rand(0.5, 1.5) + rand(0, 0.3),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: rand(6, 14),
      startX,
      startY,
      endX: startX + rand(-30, 30),
      endY: startY + rand(30, 70),
      rotation: rand(0, 720),
      isCircle: Math.random() > 0.5,
      duration: rand(1.5, 3),
    };
  });
}

/* ── main component ───────────────────────────────────────────────────── */

export interface KonamiEasterEggProps {
  secretCode?: string | null;
  displayDuration?: number | null;
  matrixCharCount?: number | null;
  confettiCount?: number | null;
}

export default function KonamiEasterEgg({
  secretCode = SECRET_CODE,
  displayDuration = DISPLAY_DURATION,
  matrixCharCount = MATRIX_CHAR_COUNT,
  confettiCount = CONFETTI_COUNT,
}: KonamiEasterEggProps = {}) {
  const [triggered, setTriggered] = useState(false);
  const [buffer, setBuffer] = useState('');

  const code = secretCode || SECRET_CODE;
  const duration = displayDuration || DISPLAY_DURATION;
  const charCount = matrixCharCount === null ? 0 : (matrixCharCount ?? MATRIX_CHAR_COUNT);
  const piecesCount = confettiCount === null ? 0 : (confettiCount ?? CONFETTI_COUNT);

  // Pre-compute all random data ONCE inside useMemo (called at mount, not during render of children)
  const matrixDrops = useMemo(() => generateMatrixDrops(charCount), [charCount]);
  const confettiPieces = useMemo(() => generateConfettiPieces(piecesCount), [piecesCount]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (triggered) return;
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const next = (buffer + e.key.toLowerCase()).slice(-code.length);
      setBuffer(next);

      if (next === code) {
        setTriggered(true);
        setBuffer('');
        setTimeout(() => setTriggered(false), duration);
      }
    },
    [buffer, triggered, code, duration]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {triggered && (
        <motion.div
          key="easter-egg-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
        >
          {/* Dark backdrop with subtle green tint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Matrix rain */}
          {matrixDrops.map((drop) => (
            <MatrixDrop key={drop.id} data={drop} />
          ))}

          {/* Confetti explosion */}
          {confettiPieces.map((piece) => (
            <ConfettiPiece key={piece.id} data={piece} />
          ))}

          {/* Center message */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 12,
                delay: 0.3,
              }}
              className="text-center relative"
            >
              {/* Glow ring behind text */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 40px 10px rgba(16,185,129,0.3)',
                    '0 0 80px 30px rgba(16,185,129,0.15)',
                    '0 0 40px 10px rgba(16,185,129,0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl"
              />

              <div className="relative bg-black/80 border border-emerald-500/30 rounded-3xl px-10 py-8 backdrop-blur-xl shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                {/* Glitch scanlines */}
                <motion.div
                  animate={{ opacity: [0, 0.03, 0, 0.05, 0] }}
                  transition={{ duration: 0.15, repeat: Infinity }}
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,0.08) 2px, rgba(16,185,129,0.08) 4px)',
                  }}
                />

                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-5xl sm:text-6xl mb-3"
                >
                  🚀
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 mb-2 tracking-tight"
                >
                  You Found It!
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-sm text-emerald-300/70 font-mono tracking-wide"
                >
                  <span className="text-emerald-400 font-bold">$</span> git commit -m
                  &quot;unlocked_easter_egg&quot;
                </motion.p>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="mt-4 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
                />

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mt-3 text-xs text-zinc-500 font-mono"
                >
                  ✦ CommitPulse v2 ✦ Built with 💚 by open-source devs
                </motion.p>
              </div>
            </motion.div>
          </div>

          {/* Top-left binary rain accent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            className="absolute top-4 left-4 font-mono text-[10px] text-emerald-500 leading-tight select-none"
          >
            {'010110\n110011\n001101\n101010\n011001\n110100'.split('\n').map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 0.6, x: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                {line}
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom-right hex accent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            className="absolute bottom-4 right-4 font-mono text-[10px] text-emerald-500 leading-tight select-none text-right"
          >
            {'0xDEAD\n0xBEEF\n0xC0DE\n0xCAFE\n0xF00D'.split('\n').map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 0.6, x: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
              >
                {line}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
