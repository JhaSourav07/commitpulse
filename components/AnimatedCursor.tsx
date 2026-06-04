'use client';

import { useEffect, useRef } from 'react';

const LIGHT_BLUE = ['#e0f2fe', '#bae6fd', '#7dd3fc', '#a5f3fc', '#dbeafe', '#f0f9ff', '#ffffff'];
const DARK_BLUE = ['#0ea5e9', '#0284c7', '#38bdf8', '#06b6d4', '#2563eb', '#0c4a6e', '#0891b2'];

export default function AnimatedCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -300, y: -300 });
  const orb = useRef({ x: -300, y: -300 });
  const rafId = useRef<number>(0);
  const lastSpawn = useRef(0);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.body.style.cursor = 'none';

    function spawnGlitters(x: number, y: number, n: number, burst: boolean) {
      for (let i = 0; i < n; i++) {
        const isLight = Math.random() > 0.5;
        const col = isLight
          ? LIGHT_BLUE[Math.floor(Math.random() * LIGHT_BLUE.length)]
          : DARK_BLUE[Math.floor(Math.random() * DARK_BLUE.length)];

        const sz = burst ? Math.random() * 4 + 2 : Math.random() * 2.5 + 1;
        const angle = Math.random() * Math.PI * 2;
        const spd = burst ? Math.random() * 4 + 1.5 : Math.random() * 1.2 + 0.2;
        const vx = Math.cos(angle) * spd;
        const vy = Math.sin(angle) * spd - (burst ? 1.5 : 0.8);

        const el = document.createElement('div');
        el.style.cssText = [
          'position:fixed',
          'border-radius:50%',
          'pointer-events:none',
          'z-index:99999',
          `width:${sz}px`,
          `height:${sz}px`,
          `background:${col}`,
          `left:${x}px`,
          `top:${y}px`,
          `box-shadow:0 0 ${sz * 2}px ${sz}px ${col}cc`,
          'transform:translate(-50%,-50%)',
        ].join(';');
        document.body.appendChild(el);

        let life = burst ? 0.8 + Math.random() * 0.4 : 0.45 + Math.random() * 0.35;
        const maxLife = life;
        let px = x,
          py = y,
          grav = 0;
        const pvx = vx;
        const pvy = vy;

        (function tick() {
          life += -0.028;
          grav += 0.055;
          px += pvx;
          py += pvy + grav;
          el.style.left = px + 'px';
          el.style.top = py + 'px';
          el.style.opacity = String(Math.max(life / maxLife, 0));
          el.style.transform = `translate(-50%,-50%) scale(${0.3 + (life / maxLife) * 0.7})`;
          if (life > 0) {
            requestAnimationFrame(tick);
          } else {
            el.remove();
          }
        })();
      }
    }

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px';
        dotRef.current.style.top = e.clientY + 'px';
      }

      const now = Date.now();
      if (now - lastSpawn.current > 22) {
        lastSpawn.current = now;
        spawnGlitters(e.clientX, e.clientY, 3, false);
      }
    };

    const onDown = (e: MouseEvent) => {
      spawnGlitters(e.clientX, e.clientY, 28, true);
    };

    const animate = () => {
      orb.current.x += (mouse.current.x - orb.current.x) * 0.13;
      orb.current.y += (mouse.current.y - orb.current.y) * 0.13;

      if (orbRef.current) {
        const dx = mouse.current.x - orb.current.x;
        const dy = mouse.current.y - orb.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const sx = 1 + Math.min(dist * 0.02, 0.4);
        const sy = (1 / sx) * 0.82 + 0.18;
        orbRef.current.style.left = orb.current.x + 'px';
        orbRef.current.style.top = orb.current.y + 'px';
        orbRef.current.style.transform = `translate(-50%,-50%) scaleX(${sx}) scaleY(${sy})`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      cancelAnimationFrame(rafId.current);
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <>
      {/* Light blue snapping dot */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 10,
          height: 10,
          background: '#e0f2fe',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99999,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 8px 3px rgba(186,230,253,0.9)',
        }}
      />
      {/* Dark blue lagging orb */}
      <div
        ref={orbRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 18,
          height: 18,
          background: '#0369a1',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99998,
          boxShadow: '0 0 18px 7px rgba(2,132,199,0.65)',
          opacity: 0.9,
        }}
      />
    </>
  );
}
