"use client";

import React from "react";

export interface EmptyStateCardProps {
  title: string;
  description: string;
  className?: string;
}

export function EmptyStateCard({
  title,
  description,
  className = "",
}: EmptyStateCardProps) {
  return (
    <div
      className={`w-full bg-white rounded-2xl border border-gray-200/80 shadow-sm py-12 sm:py-14 px-6 flex flex-col items-center justify-center text-center ${className}`}
    >
      {/* Hexagonal Exclamation Icon */}
      <div className="w-10 h-10 mb-3 text-slate-400 flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-9 h-9"
        >
          {/* Hexagon Path */}
          <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
          {/* Exclamation point */}
          <line x1="12" y1="8" x2="12" y2="12" strokeWidth="1.75" />
          <circle cx="12" cy="15.5" r="0.75" fill="currentColor" />
        </svg>
      </div>

      {/* Title */}
      <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
        {title}
      </h4>

      {/* Description */}
      <p className="text-xs sm:text-sm text-gray-500 max-w-md leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default EmptyStateCard;
