"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
}

export const STAFF_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/staff/dashboard",
    icon: (active: boolean) => (
      <svg
        className={`w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:rotate-3 ${
          active ? "text-[#140F06]" : "text-slate-400 group-hover:text-[#E8A33D]"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "New Complaint",
    href: "/staff/complaints/new",
    icon: (active: boolean) => (
      <svg
        className={`w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:rotate-90 ${
          active ? "text-[#140F06]" : "text-slate-400 group-hover:text-[#E8A33D]"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: "All Complaints",
    href: "/staff/complaints",
    icon: (active: boolean) => (
      <svg
        className={`w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:-translate-y-0.5 ${
          active ? "text-[#140F06]" : "text-slate-400 group-hover:text-[#E8A33D]"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    label: "Spares Inventory",
    href: "/staff/inventory",
    icon: (active: boolean) => (
      <svg
        className={`w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-6 ${
          active ? "text-[#140F06]" : "text-slate-400 group-hover:text-[#E8A33D]"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/staff/orders",
    icon: (active: boolean) => (
      <svg
        className={`w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 ${
          active ? "text-[#140F06]" : "text-slate-400 group-hover:text-[#E8A33D]"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    label: "Announcements",
    href: "/staff/announcements",
    icon: (active: boolean) => (
      <svg
        className={`w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:rotate-6 ${
          active ? "text-[#140F06]" : "text-slate-400 group-hover:text-[#E8A33D]"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 8a3 3 0 010 6M11 5.882l5.068-3.04A1.76 1.76 0 0119 4.354V17.65a1.76 1.76 0 01-2.932 1.512L11 16.118M5 13H3a1 1 0 01-1-1v-2a1 1 0 011-1h2" />
      </svg>
    ),
  },
];

export interface StaffNavbarProps {
  currentTab?: string;
  staffName?: string;
  onLogout?: () => void;
}

/**
 * Modern High-Impact Staff Navbar
 * - Height: h-20 (spacious & bold)
 * - Layout: Logo pinned to far-left corner, Profile & Logout pinned to far-right corner
 * - Animations: Dynamic 3D hover effects, glowing underbeams, pulsing online indicators, and micro-icons
 */
export function StaffNavbar({
  currentTab,
  staffName = "Staff",
  onLogout,
}: StaffNavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (item: NavItem) => {
    if (currentTab) {
      return currentTab.toLowerCase() === item.label.toLowerCase();
    }
    if (item.href === "/staff" || item.href === "/staff/dashboard") {
      return pathname === "/staff" || pathname === "/staff/dashboard";
    }
    if (item.href === "/staff/complaints") {
      return pathname === "/staff/complaints";
    }
    if (item.href === "/staff/complaints/new") {
      return pathname === "/staff/complaints/new";
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <nav className="relative w-full bg-[#0B0F17]/95 backdrop-blur-2xl border-b border-slate-800/80 sticky top-0 z-50 select-none shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all">
      {/* Top Ambient Glow Beam */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#E8A33D]/60 to-transparent pointer-events-none" />

      {/* Main Full-Width Container (Logo far-left, Profile/Logout far-right) */}
      <div className="w-full px-3 sm:px-8 lg:px-10 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* ================= FAR LEFT CORNER: BRAND LOGO ================= */}
        <Link
          href="/staff"
          className="flex items-center gap-2 sm:gap-3.5 group focus:outline-none shrink-0 min-w-0"
        >
          {/* Animated Sutlej Circular Emblem */}
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 drop-shadow-[0_4px_16px_rgba(0,140,238,0.55)]">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="staffSutlejBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00A2FF" />
                  <stop offset="50%" stopColor="#008CEE" />
                  <stop offset="100%" stopColor="#006CD0" />
                </linearGradient>
                <linearGradient id="staffSutlejRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#008CEE" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Outer Ring */}
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="url(#staffSutlejRing)"
                strokeWidth="3.5"
                className="opacity-90 group-hover:opacity-100 transition-opacity"
              />

              {/* Inner Disc */}
              <circle
                cx="50"
                cy="50"
                r="39"
                fill="url(#staffSutlejBlue)"
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
              />
            </svg>
          </div>

          {/* Brand Typography */}
          <div className="flex flex-col min-w-0">
            <span
              className="text-sm sm:text-base lg:text-lg font-black tracking-wider text-white leading-tight group-hover:text-sky-300 transition-colors truncate"
              style={{
                fontFamily:
                  "'Orbitron', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              }}
            >
              SUTLEJ AUTOMOTIVES
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {/* Pulsing Live Online Indicator */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-slate-400 leading-tight group-hover:text-slate-300 transition-colors">
                Staff Service Desk
              </span>
            </div>
          </div>
        </Link>

        {/* ================= CENTER: MODERN NAVIGATION MENU ================= */}
        <div className="hidden xl:flex items-center bg-[#111621]/95 border border-white/[0.08] rounded-2xl p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] gap-1.5">
          {STAFF_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative group flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden ${
                  active
                    ? "bg-gradient-to-r from-[#E8A33D] via-[#EEAC46] to-[#F5B853] text-[#140F06] font-bold shadow-[0_4px_16px_rgba(232,163,61,0.45)] -translate-y-0.5 ring-2 ring-[#E8A33D]/25"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.08] hover:-translate-y-1 hover:shadow-[0_8px_20px_-4px_rgba(232,163,61,0.25)] active:translate-y-0"
                }`}
              >
                {/* Micro Icon */}
                {item.icon(active)}

                {/* Label */}
                <span>{item.label}</span>

                {/* Animated Glowing Underbeam on Hover (Inactive Only) */}
                {!active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] w-0 bg-gradient-to-r from-[#E8A33D] to-[#FFC876] group-hover:w-4/5 transition-all duration-300 rounded-full shadow-[0_0_10px_#E8A33D]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Medium Screens Navigation Bar */}
        <div className="hidden lg:flex xl:hidden items-center bg-[#111621]/95 border border-white/[0.08] rounded-2xl p-1.5 overflow-x-auto max-w-[540px] gap-1 shadow-inner">
          {STAFF_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden ${
                  active
                    ? "bg-gradient-to-r from-[#E8A33D] to-[#F5B853] text-[#140F06] font-bold shadow-[0_2px_12px_rgba(232,163,61,0.4)]"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.08] hover:-translate-y-0.5"
                }`}
              >
                {item.icon(active)}
                <span>{item.label}</span>
                {!active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-[#E8A33D] group-hover:w-4/5 transition-all duration-300 rounded-full shadow-[0_0_8px_#E8A33D]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* ================= FAR RIGHT CORNER: PROFILE & LOG OUT ================= */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* User Profile Card */}
          <div className="hidden sm:flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] hover:border-white/15 px-3 py-1.5 rounded-full transition-all duration-200 shadow-inner group">
            {/* Avatar with Glow Ring */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-amber-500 p-0.5 shadow-sm group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-[#111621] flex items-center justify-center text-xs font-bold text-sky-300">
                {staffName.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-tight">
                {staffName}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium leading-tight flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Modern Log Out Button with Hover Arrow Animation */}
          {onLogout ? (
            <button
              onClick={onLogout}
              type="button"
              className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-rose-200 px-2.5 sm:px-4 py-2 rounded-xl border border-white/10 hover:border-rose-500/50 bg-white/[0.04] hover:bg-rose-500/15 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_0_18px_rgba(244,63,94,0.3)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Log out</span>
              <svg
                className="hidden sm:block w-4 h-4 text-slate-400 group-hover:text-rose-300 group-hover:translate-x-1 transition-transform duration-200"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          ) : (
            <Link
              href="/"
              className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-rose-200 px-2.5 sm:px-4 py-2 rounded-xl border border-white/10 hover:border-rose-500/50 bg-white/[0.04] hover:bg-rose-500/15 transition-all duration-200 shadow-sm hover:shadow-[0_0_18px_rgba(244,63,94,0.3)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Log out</span>
              <svg
                className="hidden sm:block w-4 h-4 text-slate-400 group-hover:text-rose-300 group-hover:translate-x-1 transition-transform duration-200"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </Link>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="lg:hidden text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/[0.08] transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Animated Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#0B0F17]/98 backdrop-blur-2xl px-5 py-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl">
          {STAFF_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-gradient-to-r from-[#E8A33D] to-[#F5B453] text-[#140F06] font-bold shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {item.icon(active)}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

export default StaffNavbar;
