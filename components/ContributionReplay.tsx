'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Day = { date: string; count: number; weekday: number };
type Filter = '30d' | '6m' | '1y' | 'all';
type Speed = 1 | 2 | 4 | 8;
type SvgState = 'idle' | 'loading' | 'loaded' | 'error';

interface Props {
  username: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FILTER_LABELS: Record<Filter, string> = {
  '30d': 'Last 30 Days',
  '6m': 'Last 6 Months',
  '1y': 'This Year',
  all: 'All Time',
};

const SPEEDS: Speed[] = [1, 2, 4, 8];

function cellColor(count: number, peak: number): string {
  if (count === 0) return 'transparent';
  const r = Math.min(count / Math.max(peak * 0.6, 1), 1);
  if (r < 0.25) return '#0e4429';
  if (r < 0.5) return '#006d32';
  if (r < 0.75) return '#26a641';
  return '#39d353';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContributionReplay({ username }: Props) {
  const [allDays, setAllDays] = useState<Day[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(4);
  const [filter, setFilter] = useState<Filter>('1y');
  const [fetchState, setFetchState] = useState<SvgState>('idle');
  const [peak, setPeak] = useState(1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch data when username or filter changes ────────────────────────────
  useEffect(() => {
    // Schedule resets asynchronously — bare setState at the top level of an
    // effect body is flagged by react-hooks/set-state-in-effect.
    queueMicrotask(() => {
      setFetchState('loading');
      setAllDays([]);
      setRevealed(0);
      setIsPlaying(false);
    });

    const controller = new AbortController();

    fetch(`/api/contributions?user=${username}&filter=${filter}`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) {
          setFetchState('error');
          return;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const days: Day[] = data.days ?? [];
        setAllDays(days);
        setPeak(Math.max(...days.map((d) => d.count), 1));
        setFetchState('loaded');
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setFetchState('error');
      });

    return () => controller.abort();
  }, [username, filter]);

  // ── Playback tick ─────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    setRevealed((prev) => {
      const next = prev + 7 * speed;
      if (next >= allDays.length) {
        setIsPlaying(false);
        return allDays.length;
      }
      return next;
    });
  }, [allDays.length, speed]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(tick, 120);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, tick]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const visibleDays = allDays.slice(0, revealed);
  const totalContributions = visibleDays.reduce((s, d) => s + d.count, 0);

  let currentStreak = 0;
  for (let i = visibleDays.length - 1; i >= 0; i--) {
    if (visibleDays[i].count > 0) currentStreak++;
    else break;
  }

  const peakDay = visibleDays.reduce<Day | null>(
    (best, d) => (d.count > (best?.count ?? 0) ? d : best),
    null
  );

  const progress = allDays.length > 0 ? Math.round((revealed / allDays.length) * 100) : 0;

  const isFinished = revealed >= allDays.length && allDays.length > 0;

  // ── Build grid weeks ──────────────────────────────────────────────────────
  const weeks: Day[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRestart = () => {
    setRevealed(0);
    setIsPlaying(true);
  };

  const handlePlayPause = () => setIsPlaying((p) => !p);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="replay-root">
      {/* Header */}
      <div className="replay-header">
        <div>
          <h2 className="replay-title">
            <span aria-hidden="true">⚡</span> Contribution Replay
          </h2>
          <p className="replay-sub">@{username}</p>
        </div>
        {fetchState === 'loaded' && <span className="replay-badge">{allDays.length} days</span>}
      </div>

      {/* Filter tabs */}
      <div className="filter-row" role="group" aria-label="Time filter">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Heatmap */}
      <div className="heatmap-scroll" aria-label="Contribution heatmap">
        {fetchState === 'loading' && <div className="state-msg">Loading contributions…</div>}
        {fetchState === 'error' && (
          <div className="state-msg error">Could not load contributions for @{username}.</div>
        )}
        {fetchState === 'loaded' && (
          <div className="heatmap-grid">
            {weeks.map((week, wi) =>
              week.map((day, di) => {
                const idx = wi * 7 + di;
                const isVisible = idx < revealed;
                const isPeak = day.count === peak && day.count > 0;
                return (
                  <div
                    key={day.date}
                    role="gridcell"
                    aria-label={`${formatDate(day.date)}: ${day.count} contributions`}
                    className={`cell${isPeak && isVisible ? ' cell-peak' : ''}`}
                    style={{
                      backgroundColor: isVisible ? cellColor(day.count, peak) : '#161b22',
                      opacity: isVisible ? 1 : 0.4,
                      boxShadow: isPeak && isVisible ? '0 0 8px 3px rgba(57,211,83,0.55)' : 'none',
                    }}
                  />
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      {fetchState === 'loaded' && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Total</span>
            <span className="stat-value">{totalContributions.toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Streak</span>
            <span className="stat-value">{currentStreak}d</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Peak</span>
            <span className="stat-value">{peakDay ? peakDay.count : 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Progress</span>
            <span className="stat-value">{progress}%</span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Controls */}
      <div className="controls-row">
        <button
          type="button"
          className="ctrl-btn primary"
          onClick={handlePlayPause}
          disabled={fetchState !== 'loaded' || isFinished}
          aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          type="button"
          className="ctrl-btn"
          onClick={handleRestart}
          disabled={fetchState !== 'loaded'}
          aria-label="Restart replay"
        >
          ↺ Restart
        </button>

        <div className="speed-group" role="group" aria-label="Playback speed">
          <span className="speed-label">Speed</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={`speed-btn${speed === s ? ' active' : ''}`}
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Finished banner */}
      {isFinished && (
        <div className="finish-banner" role="status">
          🎉 Replay complete — {totalContributions.toLocaleString()} contributions visualized!
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .replay-root {
          background: #0d1117;
          border: 1px solid #21262d;
          border-radius: 16px;
          padding: 28px;
          font-family: 'Space Grotesk', 'Inter', sans-serif;
          color: #c9d1d9;
          max-width: 920px;
          margin: 0 auto;
        }

        /* Header */
        .replay-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .replay-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #58a6ff;
          margin: 0 0 4px;
          letter-spacing: -0.01em;
        }
        .replay-sub {
          font-size: 0.85rem;
          color: #8b949e;
          margin: 0;
        }
        .replay-badge {
          font-size: 0.75rem;
          color: #8b949e;
          background: #161b22;
          border: 1px solid #21262d;
          border-radius: 20px;
          padding: 3px 10px;
        }

        /* Filters */
        .filter-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .filter-btn {
          padding: 5px 14px;
          border-radius: 20px;
          border: 1px solid #21262d;
          background: transparent;
          color: #8b949e;
          cursor: pointer;
          font-size: 0.78rem;
          font-family: inherit;
          transition: all 0.18s;
        }
        .filter-btn:hover,
        .filter-btn.active {
          border-color: #58a6ff;
          color: #58a6ff;
          background: rgba(88, 166, 255, 0.08);
        }

        /* Heatmap */
        .heatmap-scroll {
          overflow-x: auto;
          padding-bottom: 8px;
          min-height: 96px;
          margin-bottom: 20px;
        }
        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 13px);
          grid-auto-rows: 13px;
          grid-auto-flow: column;
          gap: 3px;
        }
        .cell {
          width: 13px;
          height: 13px;
          border-radius: 2px;
          transition:
            background-color 0.25s ease,
            opacity 0.25s ease;
          cursor: default;
        }
        .state-msg {
          color: #8b949e;
          font-size: 0.875rem;
          padding: 24px 0;
        }
        .state-msg.error {
          color: #f85149;
        }

        /* Stats */
        .stats-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .stat-card {
          flex: 1;
          min-width: 90px;
          background: #161b22;
          border: 1px solid #21262d;
          border-radius: 10px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-label {
          font-size: 0.68rem;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .stat-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: #58a6ff;
          line-height: 1.1;
        }

        /* Progress bar */
        .progress-track {
          height: 4px;
          background: #21262d;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0e4429, #39d353);
          border-radius: 4px;
          transition: width 0.1s linear;
        }

        /* Controls */
        .controls-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .ctrl-btn {
          padding: 8px 20px;
          border-radius: 8px;
          border: 1px solid #21262d;
          background: #161b22;
          color: #c9d1d9;
          cursor: pointer;
          font-size: 0.875rem;
          font-family: inherit;
          transition: all 0.18s;
        }
        .ctrl-btn:hover:not(:disabled) {
          border-color: #58a6ff;
          color: #58a6ff;
        }
        .ctrl-btn.primary {
          background: rgba(88, 166, 255, 0.1);
          border-color: #58a6ff;
          color: #58a6ff;
        }
        .ctrl-btn.primary:hover:not(:disabled) {
          background: rgba(88, 166, 255, 0.2);
        }
        .ctrl-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* Speed group */
        .speed-group {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: 4px;
        }
        .speed-label {
          font-size: 0.78rem;
          color: #8b949e;
        }
        .speed-btn {
          width: 36px;
          height: 30px;
          border-radius: 6px;
          border: 1px solid #21262d;
          background: transparent;
          color: #8b949e;
          cursor: pointer;
          font-size: 0.78rem;
          font-family: inherit;
          transition: all 0.18s;
        }
        .speed-btn:hover,
        .speed-btn.active {
          border-color: #39d353;
          color: #39d353;
          background: rgba(57, 211, 83, 0.08);
        }

        /* Finish banner */
        .finish-banner {
          margin-top: 16px;
          padding: 12px 16px;
          background: rgba(57, 211, 83, 0.08);
          border: 1px solid rgba(57, 211, 83, 0.35);
          border-radius: 10px;
          color: #39d353;
          font-size: 0.875rem;
          text-align: center;
        }

        /* Mobile */
        @media (max-width: 600px) {
          .replay-root {
            padding: 16px;
          }
          .heatmap-grid {
            grid-template-columns: repeat(auto-fill, 11px);
            grid-auto-rows: 11px;
            gap: 2px;
          }
          .cell {
            width: 11px;
            height: 11px;
          }
          .stat-value {
            font-size: 1.1rem;
          }
          .stat-card {
            min-width: 70px;
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
}
