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
        className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
          active ? "text-[#1A1308]" : "text-slate-400 group-hover:text-[#E8A33D]"
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
        className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
          active ? "text-[#1A1308]" : "text-slate-400 group-hover:text-[#E8A33D]"
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
        className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
          active ? "text-[#1A1308]" : "text-slate-400 group-hover:text-[#E8A33D]"
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
        className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
          active ? "text-[#1A1308]" : "text-slate-400 group-hover:text-[#E8A33D]"
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
        className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
          active ? "text-[#1A1308]" : "text-slate-400 group-hover:text-[#E8A33D]"
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
        className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
          active ? "text-[#1A1308]" : "text-slate-400 group-hover:text-[#E8A33D]"
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
    <nav className="relative w-full bg-[#0E131B]/95 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50 select-none shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all">
      {/* Top Ambient Glow Line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E8A33D]/40 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity with Official Animated Sutlej Logo */}
        <Link
          href="/staff"
          className="flex items-center gap-3 group focus:outline-none shrink-0"
        >
          {/* Circular Sutlej Emblem Badge with Hover Glow */}
          <div className="relative w-9 h-9 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 drop-shadow-[0_2px_10px_rgba(0,140,238,0.45)]">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="staffSutlejBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#009BFA" />
                  <stop offset="50%" stopColor="#008CEE" />
                  <stop offset="100%" stopColor="#0073DC" />
                </linearGradient>
                <linearGradient id="staffSutlejRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#008CEE" stopOpacity="0.75" />
                </linearGradient>
              </defs>

              {/* Outer Ring */}
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="url(#staffSutlejRing)"
                strokeWidth="3"
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

          {/* Brand Titles */}
          <div className="flex flex-col">
            <span
              className="text-base font-black tracking-wide text-white leading-tight group-hover:text-sky-300 transition-colors"
              style={{
                fontFamily:
                  "'Orbitron', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              }}
            >
              SUTLEJ AUTOMOTIVES
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {/* Online Pulse Indicator */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium text-slate-400 leading-tight group-hover:text-slate-300 transition-colors">
                Staff Service Desk
              </span>
            </div>
          </div>
        </Link>

        {/* Center: Desktop Navigation Bar with Modern Glassmorphic Container & Hover Effects */}
        <div className="hidden xl:flex items-center bg-[#131822]/90 border border-slate-800/80 rounded-xl p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] gap-1">
          {STAFF_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative group flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap overflow-hidden ${
                  active
                    ? "bg-gradient-to-r from-[#E8A33D] to-[#F5B453] text-[#1A1308] font-bold shadow-[0_2px_12px_rgba(232,163,61,0.35)] scale-[1.02]"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.08] hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {/* Micro Icon */}
                {item.icon(active)}

                {/* Label */}
                <span>{item.label}</span>

                {/* Animated Bottom Glow Underline on Inactive Hover */}
                {!active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-[#E8A33D] to-transparent group-hover:w-4/5 transition-all duration-300 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Medium Screens Navigation Bar */}
        <div className="hidden md:flex xl:hidden items-center bg-[#131822]/90 border border-slate-800/80 rounded-xl p-1 overflow-x-auto max-w-[500px] gap-1 shadow-inner">
          {STAFF_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200 whitespace-nowrap overflow-hidden ${
                  active
                    ? "bg-gradient-to-r from-[#E8A33D] to-[#F5B453] text-[#1A1308] font-bold shadow-[0_2px_10px_rgba(232,163,61,0.35)]"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.08] hover:-translate-y-0.5"
                }`}
              >
                {item.icon(active)}
                <span>{item.label}</span>
                {!active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-[#E8A33D] to-transparent group-hover:w-4/5 transition-all duration-300 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Staff Identity & Modern Glassmorphic Log Out Button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full shadow-inner">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
              {staffName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-300 font-medium">
              {staffName}
            </span>
          </div>

          {/* Modern Log Out Button with Sliding Arrow Hover */}
          {onLogout ? (
            <button
              onClick={onLogout}
              type="button"
              className="group flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-rose-200 px-3.5 py-1.5 rounded-lg border border-white/10 hover:border-rose-500/40 bg-white/[0.04] hover:bg-rose-500/15 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_0_14px_rgba(244,63,94,0.25)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Log out</span>
              <svg
                className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-transform duration-200"
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
              className="group flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-rose-200 px-3.5 py-1.5 rounded-lg border border-white/10 hover:border-rose-500/40 bg-white/[0.04] hover:bg-rose-500/15 transition-all duration-200 shadow-sm hover:shadow-[0_0_14px_rgba(244,63,94,0.25)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Log out</span>
              <svg
                className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-transform duration-200"
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
            className="md:hidden text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-5 h-5 transition-transform duration-200"
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
        <div className="md:hidden border-t border-slate-800 bg-[#0E131B]/98 backdrop-blur-xl px-4 py-3 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {STAFF_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? "bg-gradient-to-r from-[#E8A33D] to-[#F5B453] text-[#1A1308] font-bold shadow-md"
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
