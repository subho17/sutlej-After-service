"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { EmptyStateCard } from "./EmptyStateCard";
import { loadAnnouncements, subscribeAnnouncements, type Announcement } from "@/lib/announcementsStore";
import { apiGet } from "@/lib/api";

interface AnnouncementPayload {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  active: boolean;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getStoredCustomerName(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("customerName") || "";
}

export interface CustomerDashboardProps {
  customerName?: string;
  deskTheme?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  nextServiceDate?: string;
  className?: string;
}

/**
 * CustomerDashboard Global Component
 * Matches the official Sutlej Customer Portal home view.
 * Features:
 * - Desk theme banner indicator ("Royal Plum")
 * - Hero vehicle overview card (Welcome back, license number, model, next service date)
 * - Three quick action cards (Raise a complaint, Order spares, My vehicles)
 * - Offers & greetings section with empty state
 */
export function CustomerDashboard({
  customerName: initialCustomerName,
  deskTheme = "Royal Plum",
  vehicleNumber = "PB-10-GC-PT",
  vehicleModel = "club car tempo",
  nextServiceDate = "27 Dec 2026",
  className = "",
}: CustomerDashboardProps) {
  const storedName = useSyncExternalStore(subscribe, getStoredCustomerName, () => "");
  const displayName = initialCustomerName || storedName || "Aditi";
  // Shared store: announcements published by staff appear here.
  const [announcements, setAnnouncements] = useState<Announcement[]>(loadAnnouncements);

  // Server first (works for brand-new users on any device), local fallback.
  useEffect(() => {
    let cancelled = false;
    apiGet<AnnouncementPayload[]>("/api/announcements")
      .then(({ ok, body }) => {
        if (cancelled || !ok || !body?.data) return;
        setAnnouncements(body.data);
      })
      .catch(() => {
        // Offline / server asleep: keep local data.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Live sync: new staff posts appear instantly, no refresh needed.
  useEffect(
    () => subscribeAnnouncements(() => setAnnouncements(loadAnnouncements())),
    []
  );

  const liveAnnouncements = announcements.filter((a) => a.active !== false);

  return (
    <div
      className={`w-full min-h-[calc(100vh-4.5rem)] bg-[#F8F9FA] text-slate-800 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${className}`}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ================= 1. DESK THEME BANNER ================= */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 select-none">
          <span className="text-amber-500">✨</span>
          <span>This week&apos;s desk theme:</span>
          <span className="font-semibold text-slate-800">{deskTheme}</span>
        </div>

        {/* ================= 2. DARK HERO VEHICLE STATUS CARD ================= */}
        <div className="w-full bg-[#141820] text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          {/* Left Column: Greeting & Vehicle Plate */}
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Welcome back, {displayName}
            </p>
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white uppercase"
              style={{
                fontFamily:
                  "'Rajdhani', 'Orbitron', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                letterSpacing: "0.06em",
              }}
            >
              {vehicleNumber}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 capitalize">
              {vehicleModel}
            </p>
          </div>

          {/* Right Column: Next Service Schedule */}
          <div className="sm:text-right space-y-1 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Next quarterly service
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#34D399] tracking-tight">
              {nextServiceDate}
            </p>
          </div>
        </div>

        {/* ================= 3. QUICK ACTION CARDS (3 IN A ROW) ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Action 1: Raise a complaint */}
          <Link
            href="/customer/complaints/new"
            className="group block bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
          >
            {/* Plus Icon */}
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-[#E8A33D]/10 group-hover:text-[#E8A33D] group-hover:border-[#E8A33D]/30 transition-colors">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-4 group-hover:text-[#DF8C1B] transition-colors">
              Raise a complaint
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
              Report an issue with any of your vehicles.
            </p>
          </Link>

          {/* Action 2: Order spares */}
          <Link
            href="/customer/spares"
            className="group block bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
          >
            {/* Shopping Cart Icon */}
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-[#E8A33D]/10 group-hover:text-[#E8A33D] group-hover:border-[#E8A33D]/30 transition-colors">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-4 group-hover:text-[#DF8C1B] transition-colors">
              Order spares
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
              Browse golf cart parts and place an order.
            </p>
          </Link>

          {/* Action 3: My vehicles */}
          <Link
            href="/customer/vehicles"
            className="group block bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
          >
            {/* Vehicle Front / Cart Icon */}
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-[#E8A33D]/10 group-hover:text-[#E8A33D] group-hover:border-[#E8A33D]/30 transition-colors">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <rect x="3" y="4" width="18" height="13" rx="2" />
                <path d="M7 17v3" />
                <path d="M17 17v3" />
                <circle cx="7" cy="13" r="1.5" />
                <circle cx="17" cy="13" r="1.5" />
                <path d="M3 10h18" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-4 group-hover:text-[#DF8C1B] transition-colors">
              My vehicles
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
              See service schedules for every vehicle you own.
            </p>
          </Link>
        </div>

        {/* ================= 4. SECTION: OFFERS & GREETINGS ================= */}
        <div className="space-y-3 pt-2">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Offers &amp; greetings
          </h3>
          {liveAnnouncements.length === 0 ? (
            <EmptyStateCard
              title="No offers yet"
              description="Festival greetings and special offers from our team will show up here."
            />
          ) : (
            <div className="space-y-3">
              {liveAnnouncements.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 sm:p-6"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {item.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      New
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed mt-1.5">
                    {item.message}
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1.5">
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
