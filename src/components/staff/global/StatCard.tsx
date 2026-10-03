"use client";

import React from "react";

export type StatAccent = "blue" | "rose" | "amber" | "emerald" | "slate";

export interface StatCardProps {
  label: string;
  value: number | string;
  accentColor?: StatAccent;
  trendText?: string;
  trendColor?: "emerald" | "rose" | "slate";
  comparisonText?: string;
  customIcon?: React.ReactNode;
  className?: string;
}

const colorConfig: Record<
  StatAccent,
  {
    borderLeft: string;
    iconBg: string;
    iconColor: string;
    defaultTrend: string;
    defaultTrendColor: "emerald" | "rose";
  }
> = {
  blue: {
    borderLeft: "border-l-4 border-l-blue-600",
    iconBg: "bg-blue-600",
    iconColor: "text-white",
    defaultTrend: "↗ +100%",
    defaultTrendColor: "emerald",
  },
  rose: {
    borderLeft: "border-l-4 border-l-rose-500",
    iconBg: "bg-rose-500",
    iconColor: "text-white",
    defaultTrend: "↗ +100%",
    defaultTrendColor: "rose",
  },
  amber: {
    borderLeft: "border-l-4 border-l-amber-500",
    iconBg: "bg-amber-500",
    iconColor: "text-white",
    defaultTrend: "↗ 0%",
    defaultTrendColor: "emerald",
  },
  emerald: {
    borderLeft: "border-l-4 border-l-emerald-500",
    iconBg: "bg-emerald-500",
    iconColor: "text-white",
    defaultTrend: "↗ 0%",
    defaultTrendColor: "emerald",
  },
  slate: {
    borderLeft: "border-l-4 border-l-blue-600",
    iconBg: "bg-blue-600",
    iconColor: "text-white",
    defaultTrend: "↗ +100%",
    defaultTrendColor: "emerald",
  },
};

export function StatCard({
  label,
  value,
  accentColor = "blue",
  trendText,
  trendColor,
  comparisonText = "vs. previous 7 days",
  customIcon,
  className = "",
}: StatCardProps) {
  const cfg = colorConfig[accentColor] || colorConfig.blue;
  const activeTrend = trendText ?? cfg.defaultTrend;
  const activeTrendColor = trendColor ?? cfg.defaultTrendColor;

  // Default icons matching screenshot
  const renderDefaultIcon = () => {
    switch (accentColor) {
      case "blue":
      case "slate":
        // Document icon
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case "rose":
        // Open complaint / ticket icon
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        );
      case "amber":
        // Clock icon (In progress)
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "emerald":
        // Checkmark circle icon (Resolved)
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200/80 ${cfg.borderLeft} p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all duration-200 relative overflow-hidden ${className}`}
    >
      {/* Top row: Icon + Number & Label */}
      <div className="flex items-center gap-3.5 sm:gap-4">
        {/* Circular / Rounded-xl Icon Badge */}
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}
        >
          {customIcon || renderDefaultIcon()}
        </div>

        {/* Value and Label */}
        <div className="min-w-0">
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-none">
            {value}
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1 truncate">
            {label}
          </div>
        </div>
      </div>

      {/* Bottom row: Trend indicator */}
      <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs">
        <span
          className={`font-bold ${
            activeTrendColor === "rose"
              ? "text-rose-600"
              : activeTrendColor === "emerald"
              ? "text-emerald-600"
              : "text-gray-500"
          }`}
        >
          {activeTrend}
        </span>
        <span className="text-gray-400 font-normal truncate">
          {comparisonText}
        </span>
      </div>
    </div>
  );
}

export default StatCard;
