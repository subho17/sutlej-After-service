"use client";

import React, { useEffect, useState } from "react";
import { SutlejLogo } from "./SutlejLogo";

export interface LandingLoadingScreenProps {
  /**
   * Duration in milliseconds the loading animation is displayed (default: 2400ms).
   */
  duration?: number;
  /**
   * Callback fired when the animation completes and fades out.
   */
  onComplete?: () => void;
  /**
   * Logo size for the landing animation (default: "hero").
   */
  size?: "md" | "lg" | "xl" | "hero";
  /**
   * Whether to use the transparent image asset or vector SVG (default: false).
   */
  useImage?: boolean;
}

/**
 * Centered Logo Landing Loading Screen (White Background)
 * Displays ONLY the Sutlej Automotives logo at the center on a clean white background
 * using the official logo colors (#008CEE brand blue & dark graphite),
 * with a smooth entrance, breathing pulse, and sleek minimalist loading sweep.
 */
export function LandingLoadingScreen({
  duration = 2400,
  onComplete,
  size = "hero",
  useImage = false,
}: LandingLoadingScreenProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    // Trigger exit transition before unmount
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, Math.max(duration - 650, 800));

    // Finish and unmount completely
    const finishTimer = setTimeout(() => {
      setIsFinished(true);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onComplete]);

  if (!mounted || isFinished) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Loading Sutlej Automotives"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white select-none transition-all duration-700 ease-in-out ${
        isExiting
          ? "opacity-0 scale-105 filter blur-sm pointer-events-none"
          : "opacity-100 scale-100 filter blur-0"
      }`}
    >
      {/* Soft Ambient Radial Light in Sutlej Brand Blue */}
      <div
        className="absolute w-[460px] h-[460px] rounded-full bg-[#008CEE]/8 blur-[110px] pointer-events-none transition-opacity duration-1000"
        aria-hidden="true"
      />

      {/* Centered Logo with Entrance and Glowing Pulse Animation */}
      <div className="relative z-10 flex flex-col items-center justify-center animate-logo-entry">
        <div className="animate-logo-pulse flex flex-col items-center justify-center">
          <SutlejLogo
            size={size}
            theme="light"
            animated={true}
            showText={true}
            useImage={useImage}
          />
        </div>

        {/* Minimalist Sleek Loading Line in Logo Color */}
        <div className="relative mt-8 w-28 sm:w-36 h-[3px] bg-slate-100 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#008CEE] to-transparent w-full animate-logo-loading-bar" />
        </div>
      </div>
    </div>
  );
}

export default LandingLoadingScreen;
