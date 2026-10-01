"use client";

import React, { useEffect, useMemo, useState } from "react";
import { StatCard } from "./StatCard";
import { EmptyStateCard } from "./EmptyStateCard";
import {
  loadComplaints,
  subscribeComplaints,
  type SharedComplaint,
} from "@/lib/complaintsStore";

export interface StaffDashboardProps {
  stats?: {
    totalComplaints?: number;
    openComplaints?: number;
    inProgressComplaints?: number;
    resolvedComplaints?: number;
  };
  upcomingVehiclesCount?: number;
  recentComplaintsCount?: number;
  className?: string;
}

interface DashboardVehicle {
  registrationNo: string;
  model: string;
  nextServiceDate: string;
}

/** Staff sees every vehicle saved in this browser (localStorage is per-origin). */
function loadVehicles(): DashboardVehicle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("sutlej_customer_vehicles");
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is DashboardVehicle =>
        typeof v === "object" &&
        v !== null &&
        "registrationNo" in v &&
        "nextServiceDate" in v
    );
  } catch {
    return [];
  }
}

function statusOf(c: SharedComplaint): string {
  return c.status.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Staff Dashboard Global Component
 * Displays the 4 KPI stat cards and section modules for quarterly service vehicles & recent complaints.
 *
 * Data comes from the shared complaints store (same source as All Complaints
 * + the customer portal), so stats update live without refresh. An explicit
 * `stats` prop still overrides the computed values.
 */
export function StaffDashboard({
  stats,
  className = "",
}: StaffDashboardProps) {
  // SSR-safe: server renders empty (matching `loadComplaints()` on the
  // server, which returns [] without `window`). The client syncs from
  // localStorage after mount — this cascading render is intentional.
  const [complaints, setComplaints] = useState<SharedComplaint[]>([]);
  const [vehiclesDueSoon, setVehiclesDueSoon] = useState<DashboardVehicle[]>([]);

  // Live sync: new complaints + status updates appear instantly, no refresh needed.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setComplaints(loadComplaints());
    setVehiclesDueSoon(
      loadVehicles().filter((v) => {
        const t = new Date(v.nextServiceDate).getTime();
        if (Number.isNaN(t)) return false;
        const diffDays = (t - Date.now()) / (24 * 60 * 60 * 1000);
        return diffDays >= 0 && diffDays <= 14;
      })
    );
    return subscribeComplaints(() => setComplaints(loadComplaints()));
  }, []);

  const live = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    for (const c of complaints) {
      const s = statusOf(c);
      if (s === "open" || s === "pending") open += 1;
      else if (s === "in-progress") inProgress += 1;
      else if (s === "resolved" || s === "closed") resolved += 1;
    }
    return {
      total: complaints.length,
      open,
      inProgress,
      resolved,
    };
  }, [complaints]);

  const total = stats?.totalComplaints ?? live.total;
  const open = stats?.openComplaints ?? live.open;
  const inProgress = stats?.inProgressComplaints ?? live.inProgress;
  const resolved = stats?.resolvedComplaints ?? live.resolved;

  const recentComplaints = useMemo(
    () =>
      [...complaints]
        .sort((a, b) => {
          const tb = new Date(b.createdAt || b.date).getTime();
          const ta = new Date(a.createdAt || a.date).getTime();
          return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
        })
        .slice(0, 5),
    [complaints]
  );

  return (
    <div className={`w-full min-h-[calc(100vh-4rem)] bg-[#F3EEF5] text-slate-800 p-4 sm:p-6 lg:p-8 ${className}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* KPI Stat Cards Grid (4 Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            label="Total complaints"
            value={total}
            accentColor="slate"
          />
          <StatCard
            label="Open"
            value={open}
            accentColor="rose"
          />
          <StatCard
            label="In progress"
            value={inProgress}
            accentColor="amber"
          />
          <StatCard
            label="Resolved"
            value={resolved}
            accentColor="emerald"
          />
        </div>

        {/* Section 1: Vehicles due for quarterly service */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
            Vehicles due for quarterly service
          </h3>
          {vehiclesDueSoon.length === 0 ? (
            <EmptyStateCard
              title="No vehicles due soon"
              description="Vehicles within 14 days of their quarterly service will appear here."
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200/90 shadow-sm divide-y divide-gray-100">
              {vehiclesDueSoon.map((v) => (
                <div
                  key={v.registrationNo}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 tracking-wide uppercase truncate">
                      {v.registrationNo}
                    </p>
                    <p className="text-xs text-gray-500 capitalize truncate">
                      {v.model}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 rounded-full px-2.5 py-1">
                    Due {v.nextServiceDate}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Recent complaints */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
            Recent complaints
          </h3>
          {recentComplaints.length === 0 ? (
            <EmptyStateCard
              title="No complaints yet"
              description="Complaints you register will show up here."
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200/90 shadow-sm divide-y divide-gray-100">
              {recentComplaints.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {c.id}
                      <span className="mx-1.5 text-gray-300">·</span>
                      <span className="font-medium text-gray-600">
                        {c.customerName || "Walk-in"} — {c.vehicleRegistrationNo}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {c.category}
                      <span className="mx-1.5">·</span>
                      {c.date}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 capitalize">
                    {c.status.replace("-", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;
