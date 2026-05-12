import React from "react";

type ColorKey = "blue" | "cyan" | "red" | "indigo" | "emerald";

interface DocStatCardProps {
  title: string;
  value: string;
  trend: string;
  icon?: React.ReactNode;
  color: ColorKey;
  isProgress?: boolean;
  progressValue?: number;
}

const iconColors: Record<ColorKey, string> = {
  blue:    "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  cyan:    "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  red:     "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400",
  indigo:  "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function DocStatCard({ title, value, trend, icon, color, isProgress, progressValue = 0 }: DocStatCardProps) {
  return (
    <div className="bg-gs-card p-5 rounded-2xl border border-gs-border shadow-card">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">{title}</span>
        {icon && !isProgress && (
          <div className={`p-2 rounded-xl ${iconColors[color]}`}>{icon}</div>
        )}
        {isProgress && (
          <div className="w-8 h-8 relative">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="4" className="text-gs-border" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray={`${progressValue}, 100`} />
            </svg>
          </div>
        )}
      </div>
      <h4 className="text-[28px] font-black text-gs-text leading-none mb-2">{value}</h4>
      <p className="text-[11px] font-bold text-emerald-500">{trend}</p>
    </div>
  );
}
