'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Generates an array of particles
const generateParticles = (count: number) => {
  const colors = ['#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#3b82f6'];
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100, // starting X position %
    y: Math.random() * 100, // starting Y position %
    size: Math.random() * 15 + 5, // size between 5 and 20
    color: colors[Math.floor(Math.random() * colors.length)],
    duration: Math.random() * 30 + 30, // 30s to 60s duration
    delay: Math.random() * -60, // Negative delay so they start already moving
    rotateDirection: Math.random() > 0.5 ? 1 : -1,
    // Increased base opacity for light mode visibility
    opacity: 0.3 + Math.random() * 0.3,
    borderRadius: Math.random() > 0.5 ? '2px' : '50%', // Mix of squares and circles
    xAnimStart: Math.random() * 100 - 50,
    xAnimEnd: Math.random() * -100 + 50,
  }));
};

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  rotateDirection: number;
  opacity: number;
  borderRadius: string;
  xAnimStart: number;
  xAnimEnd: number;
}

export default function BrandParticles() {
  const [particles] = useState<Particle[]>(() => generateParticles(40));
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    // The parent div dynamically dims the particles in dark mode using `dark:opacity-40`
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-100 dark:opacity-40 transition-opacity duration-300">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            left: `${particle.x}vw`,
            top: `${particle.y}vh`,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            borderRadius: particle.borderRadius,
          }}
          animate={
            shouldReduceMotion
              ? {}
              : {
                  y: [0, -150, 150, 0],
                  x: [0, particle.xAnimStart, particle.xAnimEnd, 0],
                  rotate: [0, 360 * particle.rotateDirection],
                }
          }
          transition={
            shouldReduceMotion
              ? {}
              : {
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: 'linear',
                }
          }
        />
      ))}
    </div>
  );
}
