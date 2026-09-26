"use client";

import React from "react";

export interface StatCardProps {
  label: string;
  value: number | string;
  accentColor?: "slate" | "rose" | "amber" | "emerald";
  className?: string;
}

const accentMap = {
  slate: "border-l-slate-700",
  rose: "border-l-rose-500",
  amber: "border-l-amber-500",
  emerald: "border-l-emerald-600",
};

export function StatCard({
  label,
  value,
  accentColor = "slate",
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200/80 border-l-4 ${accentMap[accentColor]} p-4 sm:p-5 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-none mb-1">
        {value}
      </div>
      <div className="text-xs font-medium text-gray-500">
        {label}
      </div>
    </div>
  );
}

export default StatCard;
