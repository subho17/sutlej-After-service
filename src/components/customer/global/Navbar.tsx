"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getStoredCustomerName(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("customerName") || "";
}

export interface CustomerNavItem {
  label: string;
  href: string;
}

export const CUSTOMER_NAV_ITEMS: CustomerNavItem[] = [
  { label: "Home", href: "/customer" },
  { label: "My Vehicles", href: "/customer/vehicles" },
  { label: "Raise Complaint", href: "/customer/complaints/new" },
  { label: "My Complaints", href: "/customer/complaints" },
  { label: "Shop Spares", href: "/customer/spares" },
  { label: "My Orders", href: "/customer/orders" },
];

export interface CustomerNavbarProps {
  currentTab?: string;
  customerName?: string;
  onLogout?: () => void;
}

/**
 * CustomerNavbar Component
 * Pinned to the top of the Customer Portal matching the Sutlej Automotives branding.
 * Features:
 * - Amber polygon logo with automotive sunburst/gear emblem
 * - Dark capsule navigation container with active amber pill tab
 * - Customer greeting (defaults to "Aditi" / dynamic from sessionStorage)
 * - Outlined Log out button
 * - Mobile responsive drawer
 */
export function CustomerNavbar({
  currentTab,
  customerName: initialCustomerName,
  onLogout,
}: CustomerNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const storedName = useSyncExternalStore(subscribe, getStoredCustomerName, () => "");
  const displayName = initialCustomerName || storedName || "Aditi";

  const isActive = (item: CustomerNavItem) => {
    if (currentTab) {
      return currentTab.trim().toLowerCase() === item.label.toLowerCase();
    }
    if (item.href === "/customer") {
      return (
        pathname === "/customer" ||
        pathname === "/customer/dashboard" ||
        pathname === "/customer/home"
      );
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("customerName");
      sessionStorage.removeItem("customerId");
      sessionStorage.removeItem("customerToken");
    }
    if (onLogout) {
      onLogout();
    } else {
      router.push("/customer/login");
    }
  };

  return (
    <nav className="relative w-full bg-[#11141A] border-b border-slate-800/80 sticky top-0 z-50 select-none shadow-md">
      {/* Top subtle golden highlight line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#E8A33D]/50 to-transparent pointer-events-none" />

      {/* Main Container */}
      <div className="w-full px-3 sm:px-6 lg:px-8 h-16 sm:h-[70px] flex items-center justify-between gap-2 sm:gap-4">
        {/* ================= LEFT: BRAND LOGO ================= */}
        <Link
          href="/customer"
          className="flex items-center gap-2 sm:gap-3 group focus:outline-none shrink-0 min-w-0"
        >
          {/* Amber Octagon / Gear Emblem */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0 drop-shadow-[0_2px_8px_rgba(232,163,61,0.4)] group-hover:scale-105 transition-transform duration-200">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="amberHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5A623" />
                  <stop offset="100%" stopColor="#DF8C1B" />
                </linearGradient>
              </defs>

              {/* Rounded Polygon / Octagon Base */}
              <polygon
                points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30"
                fill="url(#amberHexGrad)"
                stroke="#F5B445"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* Inner Gear / Sunburst Motif */}
              <circle cx="50" cy="50" r="14" fill="#11141A" />
              {/* Spokes / Gear Teeth cutouts */}
              <g fill="#11141A">
                {/* 8 rays */}
                <rect x="47" y="16" width="6" height="15" rx="2" />
                <rect x="47" y="69" width="6" height="15" rx="2" />
                <rect x="16" y="47" width="15" height="6" rx="2" />
                <rect x="69" y="47" width="15" height="6" rx="2" />
                {/* Diagonal rays */}
                <rect
                  x="47"
                  y="16"
                  width="6"
                  height="15"
                  rx="2"
                  transform="rotate(45 50 50)"
                />
                <rect
                  x="47"
                  y="69"
                  width="6"
                  height="15"
                  rx="2"
                  transform="rotate(45 50 50)"
                />
                <rect
                  x="16"
                  y="47"
                  width="15"
                  height="6"
                  rx="2"
                  transform="rotate(45 50 50)"
                />
                <rect
                  x="69"
                  y="47"
                  width="15"
                  height="6"
                  rx="2"
                  transform="rotate(45 50 50)"
                />
              </g>

              {/* Central small amber dot */}
              <circle cx="50" cy="50" r="5" fill="#F5A623" />
            </svg>
          </div>

          {/* Brand Name & Subtitle */}
          <div className="flex flex-col leading-tight min-w-0">
            <span
              className="text-white font-extrabold text-xs sm:text-base tracking-wider uppercase group-hover:text-amber-300 transition-colors truncate"
              style={{
                fontFamily:
                  "'Rajdhani', 'Orbitron', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                letterSpacing: "0.08em",
              }}
            >
              SUTLEJ AUTOMOTIVES
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
              Customer Portal
            </span>
          </div>
        </Link>

        {/* ================= CENTER: NAVIGATION CAPSULE MENU ================= */}
        <div className="hidden lg:flex items-center bg-[#171B24] border border-white/[0.08] rounded-xl px-2 py-1.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] gap-1">
          {CUSTOMER_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "bg-[#E8A33D] text-[#140F06] font-bold shadow-[0_2px_10px_rgba(232,163,61,0.35)]"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* ================= RIGHT: USER NAME & LOG OUT BUTTON ================= */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* User Name — hidden on very small phones to prevent overflow */}
          <span className="hidden min-[420px]:block text-xs sm:text-sm font-medium text-slate-200 truncate max-w-[120px]">
            {displayName}
          </span>

          {/* Outlined Log out button */}
          <button
            onClick={handleLogout}
            type="button"
            className="text-xs sm:text-sm font-medium text-slate-200 hover:text-white px-2.5 sm:px-4 py-1.5 rounded-lg border border-slate-700/80 hover:border-slate-500 bg-transparent hover:bg-white/[0.05] transition-all duration-150 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
          >
            Log out
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="lg:hidden text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
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

      {/* ================= MOBILE DROPDOWN MENU ================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#11141A] px-4 py-3 space-y-1 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
          {CUSTOMER_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  active
                    ? "bg-[#E8A33D] text-[#140F06] font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
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

export default CustomerNavbar;
