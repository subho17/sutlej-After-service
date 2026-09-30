"use client";

import React, { useState, useEffect } from "react";
import { EmptyStateCard } from "./EmptyStateCard";
import { loadComplaints, subscribeComplaints } from "@/lib/complaintsStore";

export interface CustomerComplaint {
  id: string;
  date: string;
  source: string;
  customerName: string;
  vehicleRegistrationNo: string;
  category: string;
  model: string;
  phone: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: string;
}

const DEFAULT_COMPLAINTS: CustomerComplaint[] = [
  {
    id: "SA-2026-0001",
    date: "27 Sep 2026",
    source: "Raised by customer",
    customerName: "Aditi",
    vehicleRegistrationNo: "PB-10-GC-PT",
    category: "Engine / Motor issue",
    model: "club car tempo",
    phone: "9163399882",
    status: "open",
    priority: "Medium",
  },
];

function getInitialComplaints(fallback: CustomerComplaint[]): CustomerComplaint[] {
  // Shared store: staff status updates appear here (live-synced below).
  const shared = loadComplaints();
  if (shared.length > 0) {
    return shared.map((c) => ({
      id: c.id,
      date: c.date,
      source: c.source ?? "Raised by customer",
      customerName: c.customerName,
      vehicleRegistrationNo: c.vehicleRegistrationNo,
      category: c.category,
      model: c.model,
      phone: c.phoneNumber,
      status: c.status,
      priority: c.priority,
    }));
  }
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem("sutlej_customer_complaints");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return fallback;
}

export interface MyComplaintsProps {
  initialComplaints?: CustomerComplaint[];
  className?: string;
}

/**
 * MyComplaints Global Component
 * Matches the official Sutlej Customer Portal 'My complaints' page.
 * Features:
 * - Counter header: "My complaints (N)"
 * - Complaint cards with status accent bar, formatted metadata, badge & priority
 * - Floating bottom toast notification when a complaint is newly registered
 */
export function MyComplaints({
  initialComplaints,
  className = "",
}: MyComplaintsProps) {
  const [complaints, setComplaints] = useState<CustomerComplaint[]>(() => {
    const fallback =
      initialComplaints && initialComplaints.length > 0
        ? initialComplaints
        : DEFAULT_COMPLAINTS;
    return getInitialComplaints(fallback);
  });

  // Live sync: staff status updates appear instantly, no refresh needed.
  useEffect(() => {
    const defaults =
      initialComplaints && initialComplaints.length > 0
        ? initialComplaints
        : DEFAULT_COMPLAINTS;
    return subscribeComplaints(() => setComplaints(getInitialComplaints(defaults)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const submitted = sessionStorage.getItem("lastSubmittedComplaint");
    if (!submitted) return null;
    sessionStorage.removeItem("lastSubmittedComplaint");
    return `Complaint ${submitted} submitted — our team will review it`;
  });

  // Auto-dismiss the toast notification
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] border border-rose-200/50">
            Open
          </span>
        );
      case "in progress":
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 border border-sky-200/50">
            In progress
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200/50">
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/50">
            {status}
          </span>
        );
    }
  };

  const getAccentColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-[#DC2626]";
      case "in progress":
      case "in-progress":
        return "bg-[#0284C7]";
      case "resolved":
        return "bg-[#16A34A]";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <div
      className={`w-full min-h-[calc(100vh-4.5rem)] bg-[#F8F9FA] text-slate-800 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative ${className}`}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ================= PAGE TITLE ================= */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            <span>My complaints</span>
            <span className="text-gray-500 font-normal ml-2">
              ({complaints.length})
            </span>
          </h1>
        </div>

        {/* ================= COMPLAINTS LIST ================= */}
        {complaints.length === 0 ? (
          <EmptyStateCard
            title="No complaints yet"
            description="Complaints you register will show up here."
          />
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="relative bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 gap-4"
              >
                {/* Left Status Vertical Accent Bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 sm:w-2 ${getAccentColor(
                    c.status
                  )}`}
                  aria-hidden="true"
                />

                {/* Left Column: Metadata, Title, Details */}
                <div className="pl-2 sm:pl-3 space-y-1">
                  {/* Metadata line: ID · Date · Source */}
                  <p className="text-xs text-gray-400 font-medium tracking-wide">
                    <span>{c.id}</span>
                    <span className="mx-1.5">·</span>
                    <span>{c.date}</span>
                    <span className="mx-1.5">·</span>
                    <span>{c.source}</span>
                  </p>

                  {/* Title line: Customer — Vehicle Reg */}
                  <h3
                    className="text-base sm:text-lg font-bold text-gray-900 tracking-wide uppercase"
                    style={{
                      fontFamily:
                        "'Rajdhani', 'Orbitron', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <span>{c.customerName}</span>
                    <span className="mx-2 text-gray-400">—</span>
                    <span>{c.vehicleRegistrationNo}</span>
                  </h3>

                  {/* Details line: Category · Model · Phone */}
                  <p className="text-xs sm:text-sm text-gray-500">
                    <span>{c.category}</span>
                    <span className="mx-1.5 text-gray-400">·</span>
                    <span className="capitalize">{c.model}</span>
                    {c.phone && (
                      <>
                        <span className="mx-1.5 text-gray-400">·</span>
                        <span>{c.phone}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Right Column: Status Badge & Priority */}
                <div className="pl-2 sm:pl-0 sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
                  {getStatusBadge(c.status)}
                  <span className="text-xs text-gray-500 font-medium">
                    {c.priority} priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= FLOATING BOTTOM TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="bg-[#151922] text-white text-xs sm:text-sm font-medium px-5 py-3 rounded-lg shadow-2xl border-b-2 border-b-[#E8A33D] flex items-center gap-2">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyComplaints;
