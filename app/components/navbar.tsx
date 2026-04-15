"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, Activity } from "lucide-react";

function GithubMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const NAV_LINKS = [
  {
    label: "GitHub Repo",
    href: "https://github.com/JiteshYadavvvvv/commitpulse",
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const animationRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 50, y: 50 });
  const currentRef = useRef({ x: 50, y: 50 });
  const activeRef = useRef(false);

  const shellVars = {
    // Defaults keep the glow centered before pointer interaction.
    ["--mx" as string]: "50%",
    ["--my" as string]: "50%",
    ["--glow-opacity" as string]: "0",
    ["--border-opacity" as string]: "0",
  } as CSSProperties & Record<string, string>;

  const updateRect = () => {
    const shell = shellRef.current;
    rectRef.current = shell ? shell.getBoundingClientRect() : null;
  };

  const animateGlow = () => {
    const shell = shellRef.current;

    if (!shell) {
      animationRef.current = null;
      return;
    }

    const smoothing = 0.16;
    currentRef.current.x += (targetRef.current.x - currentRef.current.x) * smoothing;
    currentRef.current.y += (targetRef.current.y - currentRef.current.y) * smoothing;

    shell.style.setProperty("--mx", `${currentRef.current.x}%`);
    shell.style.setProperty("--my", `${currentRef.current.y}%`);
    shell.style.setProperty("--glow-opacity", activeRef.current ? "1" : "0");
    shell.style.setProperty("--border-opacity", activeRef.current ? "1" : "0");

    const settled =
      Math.abs(targetRef.current.x - currentRef.current.x) < 0.08 &&
      Math.abs(targetRef.current.y - currentRef.current.y) < 0.08;

    if (!activeRef.current && settled) {
      animationRef.current = null;
      return;
    }

    animationRef.current = requestAnimationFrame(animateGlow);
  };

  const startAnimation = () => {
    if (animationRef.current !== null) return;
    animationRef.current = requestAnimationFrame(animateGlow);
  };

  useEffect(() => {
    updateRect();

    const handleViewportChange = () => {
      updateRect();
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    let resizeObserver: ResizeObserver | null = null;

    if (shellRef.current && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(handleViewportChange);
      resizeObserver.observe(shellRef.current);
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      resizeObserver?.disconnect();
    };
  }, []);

  const handleLogoClick = () => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
    
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setOpen(false);
      }
    };

    // Close stale mobile menu state if we land on md+ immediately.
    if (mediaQuery.matches) {
      setOpen(false);
    }

    mediaQuery.addEventListener("change", handleBreakpointChange);

    return () => {
      mediaQuery.removeEventListener("change", handleBreakpointChange);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div
          ref={shellRef}
          className="relative overflow-hidden rounded-2xl border border-white/25 bg-black/45 backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
          style={shellVars}
          onMouseEnter={updateRect}
          onMouseMove={(event) => {
            if (!rectRef.current) {
              rectRef.current = event.currentTarget.getBoundingClientRect();
            }

            const rect = rectRef.current;

            if (!rect) return;

            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;

            targetRef.current = { x, y };
            activeRef.current = true;
            startAnimation();
          }}
          onMouseLeave={() => {
            activeRef.current = false;
            rectRef.current = null;
            startAnimation();
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
            style={{
              opacity: "var(--glow-opacity)",
              background:
                "radial-gradient(180px 105px at var(--mx) var(--my), rgba(255,255,255,0.26), rgba(191,219,254,0.18) 30%, rgba(244,114,182,0.1) 48%, rgba(0,0,0,0) 68%)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20" />
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl p-px transition-opacity duration-300 ease-out"
            style={{
              opacity: "var(--border-opacity)",
              background:
                "radial-gradient(150px 90px at var(--mx) var(--my), rgba(255,255,255,0.98), rgba(186,230,253,0.64) 32%, rgba(196,181,253,0.34) 50%, rgba(0,0,0,0) 68%)",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
          <nav className="relative flex items-center justify-between px-4 py-3 sm:px-6">
            <Link
              href="/"
              aria-label="Go to home"
              className="group inline-flex items-center gap-3"
              onClick={handleLogoClick}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/35 bg-white/10 text-white shadow-[0_0_25px_rgba(255,255,255,0.22)] transition-transform duration-300 group-hover:scale-105">
                <Activity size={19} />
              </span>
              <span className="text-base font-semibold tracking-[0.08em] text-white sm:text-lg">
                CommitPulse
              </span>
            </Link>

            <div className="hidden items-center gap-3 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/45 hover:bg-white/10"
                >
                  <GithubMark />
                  {link.label}
                </a>
              ))}
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 p-2 text-white/90 transition hover:bg-white/10 md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>

          {open ? (
            <div className="border-t border-white/10 px-4 py-3 md:hidden">
              <ul className="space-y-2">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="inline-flex w-full items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/45 hover:bg-white/10"
                    >
                      <GithubMark />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
