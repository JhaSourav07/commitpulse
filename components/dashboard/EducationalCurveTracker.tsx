'use client';

import React, { useEffect, useState } from 'react';
import { LearningCurveData } from '@/types/student';

interface EducationalCurveTrackerProps {
  username: string;
}

export default function EducationalCurveTracker({ username }: EducationalCurveTrackerProps) {
  const [data, setData] = useState<LearningCurveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLearningCurve() {
      try {
        const res = await fetch(`/api/learning-curve?username=${username}`);
        const json = await res.json();

        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to fetch learning data');
        }
      } catch {
        setError('Network error occurred while fetching learning curve.');
      } finally {
        setLoading(false);
      }
    }

    fetchLearningCurve();
  }, [username]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="col-span-1 h-48 bg-slate-100 dark:bg-zinc-800/50 rounded-3xl"></div>
          <div className="col-span-2 h-48 bg-slate-100 dark:bg-zinc-800/50 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const maxCommits = Math.max(...data.timeline.map((d) => d.totalDailyCommits), 1);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Bento Card 1: Study Streak & Primary Focus */}
        <div className="col-span-1 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-3xl p-6 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1 duration-300">
          <div>
            <h3 className="text-rose-800 dark:text-rose-400 text-sm font-medium tracking-wide uppercase mb-1">
              Current Focus
            </h3>
            <p className="text-rose-950 dark:text-rose-100 font-semibold text-xl leading-tight">
              {data.primaryDomain}
            </p>
          </div>

          <div className="mt-6 flex items-end gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-white dark:bg-rose-900/40 rounded-2xl shadow-sm text-rose-500 dark:text-rose-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-rose-900 dark:text-rose-50">
                {data.totalStudyDays}
              </p>
              <p className="text-rose-700 dark:text-rose-300/80 text-xs font-medium">
                Active Study Days
              </p>
            </div>
          </div>
        </div>

        {/* Bento Card 2: The 30-Day Learning Curve Visualizer */}
        <div className="col-span-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-6 shadow-sm flex flex-col transition-transform hover:-translate-y-1 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-indigo-900 dark:text-indigo-100 text-sm font-medium tracking-wide uppercase">
              Syllabus Momentum
            </h3>
            <span className="text-indigo-400 dark:text-indigo-400/80 text-xs font-medium">
              Last 30 Days
            </span>
          </div>

          <div className="flex-1 flex items-end gap-2 h-full w-full relative">
            {data.timeline.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-indigo-300 dark:text-indigo-700 text-sm">
                No educational commits in the recent window.
              </div>
            ) : (
              data.timeline.map((point, idx) => {
                const heightPercentage = (point.totalDailyCommits / maxCommits) * 100;
                return (
                  <div
                    key={point.date + idx}
                    className="flex-1 bg-indigo-200 dark:bg-indigo-500/30 hover:bg-indigo-400 dark:hover:bg-indigo-400/60 rounded-t-sm transition-colors duration-200 group relative"
                    style={{ height: `${Math.max(heightPercentage, 4)}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-indigo-900 dark:bg-indigo-100 text-white dark:text-indigo-950 text-xs px-2 py-1 rounded-md whitespace-nowrap z-10 shadow-lg">
                      {point.totalDailyCommits} commits <br />
                      <span className="text-indigo-300 dark:text-indigo-600 text-[10px]">
                        {point.date}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
