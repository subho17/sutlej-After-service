"use client";

import React from "react";
import { StatCard } from "./StatCard";
import { EmptyStateCard } from "./EmptyStateCard";

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

/**
 * Staff Dashboard Global Component
 * Displays the 4 KPI stat cards and section modules for quarterly service vehicles & recent complaints.
 */
export function StaffDashboard({
  stats = {
    totalComplaints: 0,
    openComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
  },
  className = "",
}: StaffDashboardProps) {
  const total = stats.totalComplaints ?? 0;
  const open = stats.openComplaints ?? 0;
  const inProgress = stats.inProgressComplaints ?? 0;
  const resolved = stats.resolvedComplaints ?? 0;

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
          <EmptyStateCard
            title="No vehicles due soon"
            description="Vehicles within 14 days of their quarterly service will appear here."
          />
        </div>

        {/* Section 2: Recent complaints */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
            Recent complaints
          </h3>
          <EmptyStateCard
            title="No complaints yet"
            description="Complaints you register will show up here."
          />
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;
