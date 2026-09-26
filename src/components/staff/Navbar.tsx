"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
}

export const STAFF_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/staff/dashboard" },
  { label: "New Complaint", href: "/staff/complaints/new" },
  { label: "All Complaints", href: "/staff/complaints" },
  { label: "Spares Inventory", href: "/staff/inventory" },
  { label: "Orders", href: "/staff/orders" },
  { label: "Announcements", href: "/staff/announcements" },
];

export interface StaffNavbarProps {
  currentTab?: string;
  staffName?: string;
  onLogout?: () => void;
}

/**
 * Staff Navbar Component
 * Features the official Sutlej circular emblem, brand typography,
 * high-contrast pill navigation, and staff session actions.
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
    <nav className="w-full bg-[#181D24] border-b border-slate-800/80 sticky top-0 z-50 select-none shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity with Official Sutlej Logo */}
        <Link
          href="/staff"
          className="flex items-center gap-3 group focus:outline-none shrink-0"
        >
          {/* Circular Sutlej Emblem Badge */}
          <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,140,238,0.4)]"
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
                className="opacity-90"
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
            <span className="text-[11px] font-medium text-slate-400 leading-tight">
              Staff Service Desk
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Bar with Rounded Pill Container */}
        <div className="hidden xl:flex items-center bg-[#13171D] border border-slate-800/80 rounded-lg p-1 shadow-inner">
          {STAFF_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "bg-[#E8A33D] text-[#1A1308] shadow-[0_1px_3px_rgba(0,0,0,0.3)] font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Medium Screens Navigation Bar (scrollable horizontally if needed) */}
        <div className="hidden md:flex xl:hidden items-center bg-[#13171D] border border-slate-800/80 rounded-lg p-1 overflow-x-auto max-w-[500px]">
          {STAFF_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "bg-[#E8A33D] text-[#1A1308] font-bold shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Staff Identity & Log Out Action */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
            {staffName}
          </span>

          {onLogout ? (
            <button
              onClick={onLogout}
              type="button"
              className="text-xs font-semibold text-slate-200 hover:text-white px-3.5 py-1.5 rounded-md border border-slate-700/80 hover:border-slate-500 bg-[#1D232C] hover:bg-[#252C37] transition-all duration-200 cursor-pointer shadow-sm"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/"
              className="text-xs font-semibold text-slate-200 hover:text-white px-3.5 py-1.5 rounded-md border border-slate-700/80 hover:border-slate-500 bg-[#1D232C] hover:bg-[#252C37] transition-all duration-200 shadow-sm"
            >
              Log out
            </Link>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="md:hidden text-slate-300 hover:text-white p-1.5 rounded-md hover:bg-slate-800/60"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-5 h-5"
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

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#14181F] px-4 py-3 space-y-1 animate-in fade-in duration-200">
          {STAFF_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[#E8A33D] text-[#1A1308] font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

export default StaffNavbar;
