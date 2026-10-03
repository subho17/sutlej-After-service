import React from "react";
import { StaffAnalyticsGraphs } from "@/components/staff/global";

export const metadata = {
  title: "Analytics & Telemetrics | Sutlej Automotives",
  description: "Financial performance, orders income, and service throughput analytics for staff.",
};

export default function StaffAnalyticsPage() {
  return (
    <div className="w-full min-h-[calc(100vh-4.25rem)] bg-[#F4F6FB] text-slate-800 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
            Financial &amp; Operations Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time trends for spare parts revenue, customer orders income, and service desk performance.
          </p>
        </div>

        <StaffAnalyticsGraphs />
      </div>
    </div>
  );
}
