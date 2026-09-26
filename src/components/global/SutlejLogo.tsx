"use client";

import React from "react";
import Image from "next/image";

export interface SutlejLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  theme?: "dark" | "light" | "auto";
  animated?: boolean;
  showText?: boolean;
  useImage?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeConfig = {
  sm: {
    badgeSize: 36,
    textSize: "text-xs",
    gap: "gap-2.5",
    container: "h-9",
    imageWidth: 140,
    imageHeight: 48,
  },
  md: {
    badgeSize: 52,
    textSize: "text-base",
    gap: "gap-3",
    container: "h-14",
    imageWidth: 200,
    imageHeight: 68,
  },
  lg: {
    badgeSize: 76,
    textSize: "text-xl",
    gap: "gap-4",
    container: "h-20",
    imageWidth: 280,
    imageHeight: 96,
  },
  xl: {
    badgeSize: 104,
    textSize: "text-2xl",
    gap: "gap-5",
    container: "h-28",
    imageWidth: 360,
    imageHeight: 122,
  },
  hero: {
    badgeSize: 136,
    textSize: "text-3xl sm:text-4xl",
    gap: "gap-6",
    container: "h-36",
    imageWidth: 460,
    imageHeight: 156,
  },
};

/**
 * SutlejLogo Component
 * Accurately represents the official Sutlej Automotives circular emblem and geometric typography.
 */
export function SutlejLogo({
  size = "md",
  theme = "light",
  animated = false,
  showText = true,
  useImage = false,
  className = "",
  onClick,
}: SutlejLogoProps) {
  const currentSize = sizeConfig[size] || sizeConfig.md;
  const isDark = theme === "dark";

  if (useImage) {
    return (
      <div
        onClick={onClick}
        className={`relative inline-flex flex-col items-center justify-center select-none ${className} ${
          onClick ? "cursor-pointer" : ""
        }`}
      >
        <div
          className={`relative transition-transform duration-300 ${
            animated ? "hover:scale-105" : ""
          }`}
          style={{ width: currentSize.imageWidth, height: currentSize.imageHeight }}
        >
          <Image
            src={isDark ? "/sutlej-logo-dark.png" : "/sutlej-logo.png"}
            alt="Sutlej Automotives"
            fill
            priority
            sizes={`${currentSize.imageWidth}px`}
            className="object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-center justify-center select-none ${currentSize.gap} ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Emblem Badge */}
      <div
        className={`relative flex items-center justify-center transition-all duration-500 ${
          animated ? "animate-logo-pulse" : ""
        }`}
        style={{ width: currentSize.badgeSize, height: currentSize.badgeSize }}
      >
        {/* Ambient Glow Aura */}
        <div
          className="absolute inset-0 rounded-full bg-[#008CEE]/15 blur-xl transform scale-110 pointer-events-none"
          aria-hidden="true"
        />

        {/* SVG Circular Badge with Flowing S Ribbon */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative z-10 drop-shadow-[0_4px_16px_rgba(0,140,238,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`sutlejGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#009BFA" />
              <stop offset="50%" stopColor="#008CEE" />
              <stop offset="100%" stopColor="#0073DC" />
            </linearGradient>

            <linearGradient id={`outerRingGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#008CEE" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* Outer Thin Ring */}
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke={`url(#outerRingGrad-${size})`}
            strokeWidth="2.8"
            className={animated ? "opacity-95" : "opacity-85"}
          />

          {/* Inner Solid Badge Disc */}
          <circle
            cx="50"
            cy="50"
            r="39"
            fill={`url(#sutlejGrad-${size})`}
          />

          {/* Flowing White River 'S' Curve */}
          <path
            d="M 54.2 12
               C 54.5 12, 50.8 24.5, 39.5 33.2
               C 30.2 41, 32.5 54.5, 46.8 65
               C 55.6 71.5, 57.5 78.5, 45.8 88
               C 45.5 88, 49.2 75.5, 60.5 66.8
               C 69.8 59, 67.5 45.5, 53.2 35
               C 44.4 28.5, 42.5 21.5, 54.2 12 Z"
            fill="#FFFFFF"
            className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
          />

          {/* Specular Highlight Arc */}
          <path
            d="M 22 36 A 39 39 0 0 1 65 14"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
        </svg>
      </div>

      {/* Typography: SUTLEJ AUTOMOTIVES */}
      {showText && (
        <div className="flex flex-col items-center tracking-widest text-center">
          <div className="flex items-center gap-2.5 font-black uppercase tracking-[0.22em] select-none">
            <span
              className={`${currentSize.textSize} text-[#008CEE] font-black drop-shadow-[0_0_12px_rgba(0,140,238,0.25)]`}
              style={{
                fontFamily:
                  "'Orbitron', 'Rajdhani', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              }}
            >
              SUTLEJ
            </span>
            <span
              className={`${currentSize.textSize} ${
                isDark ? "text-slate-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" : "text-[#1E232E]"
              } font-black`}
              style={{
                fontFamily:
                  "'Orbitron', 'Rajdhani', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              }}
            >
              AUTOMOTIVES
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SutlejLogo;
