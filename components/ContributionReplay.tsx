'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type Day = {
  date: string;
  count: number;
  weekday: number;
};

type ReplayFilter = '30d' | '6m' | '1y' | 'all';
type Speed = 1 | 2 | 4 | 8;

interface Props {
  username: string;
}

const FILTER_LABELS: Record<ReplayFilter, string> = {
  '30d': 'Last 30 Days',
  '6m': 'Last 6 Months',
  '1y': 'This Year',
  all: 'All Time',
};

function getColor(count: number, peak: number): string {
  if (count === 0) return '#161b22';

  const intensity = Math.min(count / Math.max(peak * 0.7, 1), 1);

  if (intensity < 0.25) return '#0e4429';
  if (intensity < 0.5) return '#006d32';
  if (intensity < 0.75) return '#26a641';

  return '#39d353';
}

export default function ContributionReplay({ username }: Props) {
  const [allDays, setAllDays] = useState<Day[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(4);
  const [filter, setFilter] = useState<ReplayFilter>('1y');
  const [loading, setLoading] = useState(true);
  const [peak, setPeak] = useState(1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch contribution data
  useEffect(() => {
    fetch(`/api/contributions?user=${username}&filter=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        setAllDays(data.days ?? []);

        const max = Math.max(...(data.days ?? []).map((d: Day) => d.count), 1);

        setPeak(max);
      })
      .finally(() => setLoading(false));
  }, [username, filter]);

  // Playback engine
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
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, tick]);

  // Stats
  const visibleDays = allDays.slice(0, revealed);

  const totalContributions = visibleDays.reduce((sum, d) => sum + d.count, 0);

  let currentStreak = 0;

  for (let i = visibleDays.length - 1; i >= 0; i--) {
    if (visibleDays[i].count > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  const mostActive = visibleDays.reduce((best, d) => (d.count > best.count ? d : best), {
    date: '—',
    count: 0,
  });

  // Group into weeks
  const weeks: Day[][] = [];

  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const restart = () => {
    setRevealed(0);
    setIsPlaying(true);
  };

  const isFinished = revealed >= allDays.length && allDays.length > 0;

  return (
    <div className="replay-wrapper">
      {/* Header */}
      <div className="replay-header">
        <h2 className="replay-title">⚡ Contribution Replay</h2>

        <p className="replay-sub">@{username}</p>
      </div>

      {/* Filters */}
      <div className="filter-row">
        {(Object.keys(FILTER_LABELS) as ReplayFilter[]).map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Heatmap */}
      <div className="heatmap-scroll">
        {loading ? (
          <div className="loading-text">Fetching contribution data...</div>
        ) : (
          <div className="heatmap-grid">
            {weeks.map((week, wi) =>
              week.map((day, di) => {
                const cellIndex = wi * 7 + di;

                const isVisible = cellIndex < revealed;

                const isPeak = day.count === peak && day.count > 0;

                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} contributions`}
                    className={`cell ${isPeak && isVisible ? 'cell-peak' : ''}`}
                    style={{
                      backgroundColor: isVisible ? getColor(day.count, peak) : '#0d1117',

                      opacity: isVisible ? 1 : 0.15,

                      boxShadow: isPeak && isVisible ? '0 0 8px 2px rgba(57,211,83,0.6)' : 'none',

                      transition: 'background-color 0.3s ease, opacity 0.3s ease',
                    }}
                  />
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Contributions</div>

          <div className="stat-value">{totalContributions.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Current Streak</div>

          <div className="stat-value">{currentStreak} days</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Peak Day</div>

          <div className="stat-value">{mostActive.count} commits</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Progress</div>

          <div className="stat-value">
            {allDays.length > 0 ? Math.round((revealed / allDays.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${allDays.length > 0 ? (revealed / allDays.length) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Controls */}
      <div className="controls-row">
        <button
          className="ctrl-btn"
          onClick={() => setIsPlaying((prev) => !prev)}
          disabled={loading || isFinished}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button className="ctrl-btn" onClick={restart} disabled={loading}>
          ↺ Restart
        </button>

        <div className="speed-group">
          <span className="speed-label">Speed</span>

          {([1, 2, 4, 8] as Speed[]).map((s) => (
            <button
              key={s}
              className={`speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {isFinished && (
        <div className="finished-banner">
          🎉 Replay complete! {totalContributions.toLocaleString()} contributions visualized.
        </div>
      )}

      <style jsx>{`
        .replay-wrapper {
          background: #0d1117;
          border: 1px solid #21262d;
          border-radius: 12px;
          padding: 24px;
          color: #c9d1d9;
          max-width: 900px;
          margin: 0 auto;
        }

        .replay-header {
          margin-bottom: 20px;
        }

        .replay-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #58a6ff;
        }

        .replay-sub {
          color: #8b949e;
          margin-top: 6px;
        }

        .filter-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .filter-btn {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #21262d;
          background: transparent;
          color: #8b949e;
          cursor: pointer;
        }

        .filter-btn.active,
        .filter-btn:hover {
          border-color: #58a6ff;
          color: #58a6ff;
          background: rgba(88, 166, 255, 0.1);
        }

        .heatmap-scroll {
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 13px);
          grid-auto-rows: 13px;
          grid-auto-flow: column;
          gap: 3px;
          min-height: 104px;
        }

        .cell {
          width: 13px;
          height: 13px;
          border-radius: 2px;
        }

        .loading-text {
          color: #8b949e;
          padding: 20px 0;
        }

        .stats-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin: 20px 0 12px;
        }

        .stat-card {
          flex: 1;
          min-width: 110px;
          background: #161b22;
          border: 1px solid #21262d;
          border-radius: 8px;
          padding: 12px 16px;
        }

        .stat-label {
          font-size: 0.7rem;
          color: #8b949e;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: #58a6ff;
          margin-top: 4px;
        }

        .progress-track {
          height: 4px;
          background: #21262d;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0e4429, #39d353);
          transition: width 0.1s ease;
        }

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
        }

        .ctrl-btn:hover:not(:disabled) {
          border-color: #58a6ff;
          color: #58a6ff;
        }

        .ctrl-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .speed-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .speed-btn {
          width: 34px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid #21262d;
          background: transparent;
          color: #8b949e;
          cursor: pointer;
        }

        .speed-btn.active {
          border-color: #39d353;
          color: #39d353;
          background: rgba(57, 211, 83, 0.1);
        }

        .finished-banner {
          margin-top: 16px;
          padding: 12px 16px;
          background: rgba(57, 211, 83, 0.1);
          border: 1px solid #39d353;
          border-radius: 8px;
          color: #39d353;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
