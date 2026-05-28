'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const generatePetals = (count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100, // starting X position %
    y: -20 - Math.random() * 20, // starting Y position % (above screen)
    scale: 0.3 + Math.random() * 0.7, // size variation
    duration: 10 + Math.random() * 15, // fall duration
    delay: Math.random() * 20, // start delay
    rotation: Math.random() * 360, // initial rotation
    rotationSpeed: (Math.random() - 0.5) * 360, // rotation per fall
    sway: 10 + Math.random() * 20, // horizontal sway
  }));
};

interface Petal {
  id: number;
  x: number;
  y: number;
  scale: number;
  duration: number;
  delay: number;
  rotation: number;
  rotationSpeed: number;
  sway: number;
}

export default function CherryBlossom() {
  const [petals] = useState<Petal[]>(() => generatePetals(25));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Blurred Cherry Blossom Branch top right */}
      <div className="absolute -top-10 -right-10 w-[400px] h-[300px] opacity-40 blur-sm mix-blend-screen transform rotate-12">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          {/* Main branch */}
          <path
            d="M 200 0 C 150 50, 100 80, 50 150"
            stroke="#4a3b32"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 120 70 C 90 90, 70 120, 30 130"
            stroke="#4a3b32"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 160 30 C 180 60, 190 90, 200 120"
            stroke="#4a3b32"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* Blossoms */}
          <circle cx="150" cy="50" r="15" fill="#ffb7c5" opacity="0.8" />
          <circle cx="140" cy="60" r="12" fill="#ff9eb3" opacity="0.9" />
          <circle cx="160" cy="55" r="14" fill="#ffd1dc" opacity="0.7" />

          <circle cx="100" cy="80" r="18" fill="#ffb7c5" opacity="0.8" />
          <circle cx="90" cy="95" r="14" fill="#ff9eb3" opacity="0.9" />
          <circle cx="115" cy="85" r="16" fill="#ffd1dc" opacity="0.7" />

          <circle cx="60" cy="140" r="12" fill="#ffb7c5" opacity="0.8" />
          <circle cx="45" cy="145" r="10" fill="#ff9eb3" opacity="0.9" />

          <circle cx="180" cy="25" r="14" fill="#ffb7c5" opacity="0.8" />

          <circle cx="190" cy="100" r="10" fill="#ffb7c5" opacity="0.8" />
        </svg>
      </div>

      {/* Blurred Cherry Blossom Branch top left */}
      <div className="absolute -top-20 -left-20 w-[500px] h-[400px] opacity-30 blur-[6px] mix-blend-screen transform -rotate-12 scale-x-[-1]">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 200 0 C 150 50, 100 80, 50 150"
            stroke="#4a3b32"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 120 70 C 90 90, 70 120, 30 130"
            stroke="#4a3b32"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="150" cy="50" r="20" fill="#ffb7c5" opacity="0.8" />
          <circle cx="100" cy="80" r="25" fill="#ff9eb3" opacity="0.8" />
          <circle cx="60" cy="140" r="15" fill="#ffb7c5" opacity="0.8" />
        </svg>
      </div>

      {/* Falling Petals */}
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute top-0 left-0"
          initial={{
            x: `${petal.x}vw`,
            y: `${petal.y}vh`,
            rotate: petal.rotation,
            scale: petal.scale,
            opacity: 0,
          }}
          animate={{
            x: [
              `${petal.x}vw`,
              `${petal.x - petal.sway}vw`,
              `${petal.x + petal.sway}vw`,
              `${petal.x - petal.sway / 2}vw`,
            ],
            y: ['-10vh', '40vh', '80vh', '110vh'],
            rotate: petal.rotation + petal.rotationSpeed,
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* SVG Petal Shape */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 30 30"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_5px_rgba(255,183,197,0.5)]"
          >
            <path
              d="M15,0 C20,10 30,10 30,20 C30,25 25,30 15,25 C5,30 0,25 0,20 C0,10 10,10 15,0 Z"
              fill="#ffb7c5"
              fillOpacity="0.85"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
