'use client';

import { motion } from 'framer-motion';
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
    opacity: 0.1 + Math.random() * 0.15, // subtle opacity (0.1 to 0.25)
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
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
          animate={{
            y: [0, -150, 150, 0], // Float up and around
            x: [0, particle.xAnimStart, particle.xAnimEnd, 0],
            rotate: [0, 360 * particle.rotateDirection],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}
