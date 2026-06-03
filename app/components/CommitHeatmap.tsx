"use client";

import { useMemo, useState, useEffect } from "react";

type DayData = {
  date: string;
  count: number;
};

type Props = {
  username: string;
  data?: DayData[];
};

function generateMockData(): DayData[] {
  const days: DayData[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      date: d.toISOString().split("T")[0],
      count: Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 8),
    });
  }
  return days;
}

function getColor(count: number): string {
  if (count === 0) return "bg-gray-100 dark:bg-gray-800";
  if (count <= 2) return "bg-green-200 dark:bg-green-900";
  if (count <= 4) return "bg-green-400 dark:bg-green-700";
  if (count <= 6) return "bg-green-600 dark:bg-green-500";
  return "bg-green-800 dark:bg-green-300";
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function CommitHeatmap({ username, data }: Props) {
  const [days, setDays] = useState<DayData[]>([]);

useEffect(() => {
  setDays(data ?? generateMockData());
}, [data]);

  // Group into weeks (columns of 7)
  const weeks: DayData[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Month labels
  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((week, i) => {
    const month = new Date(week[0].date).getMonth();
    const prev = i > 0 ? new Date(weeks[i - 1][0].date).getMonth() : -1;
    if (month !== prev) {
      monthLabels.push({ label: MONTHS[month], col: i });
    }
  });

 const totalCommits = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Commit Activity
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {totalCommits} commits in the last year
        </span>
      </div>

      {/* Month labels */}
      <div className="flex gap-[3px] mb-1 ml-6">
        {weeks.map((_, i) => {
          const label = monthLabels.find((m) => m.col === i);
          return (
            <div key={i} className="w-[14px] text-[10px] text-gray-400">
              {label?.label ?? ""}
            </div>
          );
        })}
      </div>

      {/* Day labels + grid */}
      <div className="flex gap-1">
        <div className="flex flex-col gap-[3px] mr-1 justify-around">
          {["Mon", "Wed", "Fri"].map((d) => (
            <span key={d} className="text-[10px] text-gray-400 leading-[14px]">
              {d}
            </span>
          ))}
        </div>

        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${day.date}: ${day.count} commit${day.count !== 1 ? "s" : ""}`}
                  className={`w-[14px] h-[14px] rounded-sm ${getColor(day.count)} cursor-pointer hover:ring-2 hover:ring-green-400 transition-all`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 justify-end">
        <span className="text-[11px] text-gray-400">Less</span>
        {[0, 2, 4, 6, 8].map((v) => (
          <div key={v} className={`w-[14px] h-[14px] rounded-sm ${getColor(v)}`} />
        ))}
        <span className="text-[11px] text-gray-400">More</span>
      </div>
    </div>
  );
}