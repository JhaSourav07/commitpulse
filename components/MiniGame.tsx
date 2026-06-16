'use client';
import React, { useState, useEffect, useCallback } from 'react';

type Bug = {
  id: number;
  x: number;
  y: number;
  expiry: number;
  ttl: number;
  type: 'critical' | 'warning';
};

type ExtendedWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export default function MiniGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [bugs, setBugs] = useState<Bug[]>([]);

  const playClickSound = useCallback(() => {
    const AudioContextClass = window.AudioContext || (window as ExtendedWindow).webkitAudioContext;

    if (!AudioContextClass) return;

    try {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      /* ignore */
    }
  }, []);

  const playErrorSound = useCallback(() => {
    const AudioContextClass = window.AudioContext || (window as ExtendedWindow).webkitAudioContext;

    if (!AudioContextClass) return;

    try {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const baseSpawnRate = 1200;
    const currentSpawnRate = Math.max(350, baseSpawnRate - score * 15);
    const timeToLive = Math.max(1000, 2500 - score * 20);

    const spawner = setInterval(() => {
      setBugs((prev) => {
        if (prev.length > 8) return prev;
        const createdAt = Date.now();

        const newBug: Bug = {
          id: createdAt + Math.random(),
          x: 10 + Math.random() * 80,
          y: 15 + Math.random() * 70,
          ttl: timeToLive,
          expiry: createdAt + timeToLive,
          type: Math.random() > 0.8 ? 'warning' : 'critical',
        };
        return [...prev, newBug];
      });
    }, currentSpawnRate);
    return () => clearInterval(spawner);
  }, [isPlaying, gameOver, score]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const checker = setInterval(() => {
      const now = Date.now();
      setBugs((prev) => {
        const expired = prev.filter((b) => now > b.expiry);
        if (expired.length > 0) {
          playErrorSound();
          setLives((l) => {
            const newLives = l - expired.length;
            if (newLives <= 0) {
              setGameOver(true);
              setIsPlaying(false);
            }
            return newLives;
          });
        }
        return prev.filter((b) => now <= b.expiry);
      });
    }, 50);
    return () => clearInterval(checker);
  }, [isPlaying, gameOver, playErrorSound]);

  const handleBugClick = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    id: number,
    type: Bug['type']
  ) => {
    e.stopPropagation();

    if (!isPlaying || gameOver) return;

    playClickSound();
    setScore((s) => s + (type === 'warning' ? 5 : 10));
    setBugs((prev) => prev.filter((b) => b.id !== id));
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setBugs([]);
    setGameOver(false);
    setIsPlaying(true);
  };

  return (
    <div
      className="w-full h-80 bg-[#0a0a0f] border border-white/10 rounded-2xl relative overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8),_0_0_30px_rgba(0,0,0,0.5)] cursor-crosshair select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes shrinkRing {
          0% { width: 60px; height: 60px; opacity: 0; }
          10% { opacity: 1; }
          100% { width: 16px; height: 16px; opacity: 0.8; }
        }
        .bug-ring { position: absolute; border: 2px solid currentColor; border-radius: 50%; pointer-events: none; animation: shrinkRing linear forwards; }
        `,
        }}
      />

      <div className="absolute top-3 left-4 right-4 flex justify-between font-bold text-sm z-10 pointer-events-none tracking-wider font-mono">
        <span className="text-[#38bdf8] drop-shadow-[0_0_8px_#38bdf8]">SCORE: {score}</span>
        <span className="text-[#f43f5e] drop-shadow-[0_0_8px_#f43f5e]">
          {Array(Math.max(0, lives)).fill('♥').join(' ')}{' '}
          {Array(3 - Math.max(0, lives))
            .fill('♡')
            .join(' ')}
        </span>
      </div>

      {bugs.map((bug) => {
        const color = bug.type === 'critical' ? '#f43f5e' : '#eab308';
        return (
          <div
            key={bug.id}
            className="absolute flex items-center justify-center cursor-crosshair z-10 w-12 h-12 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${bug.x}%`, top: `${bug.y}%`, color: color }}
            onMouseDown={(e) => handleBugClick(e, bug.id, bug.type)}
            onTouchStart={(e) => handleBugClick(e, bug.id, bug.type)}
          >
            <div
              className="w-4 h-4 rounded-full z-10 pointer-events-none shadow-[0_0_15px_currentColor]"
              style={{ background: color }}
            />
            <div className="bug-ring" style={{ animationDuration: `${bug.ttl}ms` }} />
          </div>
        );
      })}

      {!isPlaying && !gameOver && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-center items-center z-20 text-center">
          <div className="text-xl text-white font-bold mb-2 tracking-wide">SQUASH THE BUGS</div>
          <p className="text-gray-400 text-xs mb-6 font-mono">
            Click targets before the ring closes.
            <br />
            Avoid TLE!
          </p>
          <button
            tabIndex={-1}
            onClick={startGame}
            className="px-6 py-2 border-2 border-[#38bdf8] text-white font-bold rounded-lg uppercase tracking-widest hover:bg-[#38bdf8] hover:text-black transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)]"
          >
            Initialize
          </button>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col justify-center items-center z-20 text-center">
          <div className="text-2xl text-[#f43f5e] font-black mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">
            SYSTEM FAILURE
          </div>
          <p className="text-gray-400 text-sm mb-6 font-mono">
            Bugs Squashed: <span className="text-white font-bold">{score}</span>
          </p>
          <button
            tabIndex={-1}
            onClick={startGame}
            className="px-6 py-2 border-2 border-[#f43f5e] text-white font-bold rounded-lg uppercase tracking-widest hover:bg-[#f43f5e] hover:text-black transition-all"
          >
            Reboot
          </button>
        </div>
      )}
    </div>
  );
}
