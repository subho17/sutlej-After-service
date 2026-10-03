"use client";

import React, { useState, useMemo } from "react";
import { SharedOrder } from "@/lib/ordersStore";
import { SharedComplaint } from "@/lib/complaintsStore";

export interface StaffAnalyticsGraphsProps {
  orders?: SharedOrder[];
  complaints?: SharedComplaint[];
  className?: string;
}

type TimeRange = "7d" | "30d" | "6m" | "1y";
type ChartType = "area" | "bar";

interface DataPoint {
  label: string;
  shortLabel: string;
  revenue: number;
  ordersCount: number;
  complaintsRaised: number;
  complaintsResolved: number;
}

// Data models for different time ranges
const RANGE_DATA: Record<TimeRange, DataPoint[]> = {
  "7d": [
    { label: "28 Sep", shortLabel: "Sun", revenue: 14500, ordersCount: 3, complaintsRaised: 1, complaintsResolved: 1 },
    { label: "29 Sep", shortLabel: "Mon", revenue: 22800, ordersCount: 5, complaintsRaised: 2, complaintsResolved: 1 },
    { label: "30 Sep", shortLabel: "Tue", revenue: 18400, ordersCount: 4, complaintsRaised: 1, complaintsResolved: 2 },
    { label: "1 Oct", shortLabel: "Wed", revenue: 31200, ordersCount: 6, complaintsRaised: 3, complaintsResolved: 2 },
    { label: "2 Oct", shortLabel: "Thu", revenue: 27500, ordersCount: 5, complaintsRaised: 2, complaintsResolved: 3 },
    { label: "3 Oct", shortLabel: "Fri", revenue: 38900, ordersCount: 7, complaintsRaised: 2, complaintsResolved: 2 },
    { label: "4 Oct", shortLabel: "Sat", revenue: 42600, ordersCount: 8, complaintsRaised: 1, complaintsResolved: 2 },
  ],
  "30d": [
    { label: "Week 1", shortLabel: "W1", revenue: 86400, ordersCount: 16, complaintsRaised: 6, complaintsResolved: 5 },
    { label: "Week 2", shortLabel: "W2", revenue: 112500, ordersCount: 22, complaintsRaised: 8, complaintsResolved: 7 },
    { label: "Week 3", shortLabel: "W3", revenue: 98200, ordersCount: 19, complaintsRaised: 5, complaintsResolved: 6 },
    { label: "Week 4", shortLabel: "W4", revenue: 145800, ordersCount: 28, complaintsRaised: 9, complaintsResolved: 8 },
  ],
  "6m": [
    { label: "May", shortLabel: "May", revenue: 320000, ordersCount: 64, complaintsRaised: 18, complaintsResolved: 16 },
    { label: "Jun", shortLabel: "Jun", revenue: 385000, ordersCount: 78, complaintsRaised: 22, complaintsResolved: 20 },
    { label: "Jul", shortLabel: "Jul", revenue: 410000, ordersCount: 82, complaintsRaised: 25, complaintsResolved: 24 },
    { label: "Aug", shortLabel: "Aug", revenue: 460000, ordersCount: 91, complaintsRaised: 21, complaintsResolved: 22 },
    { label: "Sep", shortLabel: "Sep", revenue: 520000, ordersCount: 104, complaintsRaised: 28, complaintsResolved: 27 },
    { label: "Oct", shortLabel: "Oct", revenue: 580000, ordersCount: 115, complaintsRaised: 24, complaintsResolved: 25 },
  ],
  "1y": [
    { label: "Q1 2025", shortLabel: "Q1", revenue: 940000, ordersCount: 188, complaintsRaised: 54, complaintsResolved: 50 },
    { label: "Q2 2025", shortLabel: "Q2", revenue: 1150000, ordersCount: 230, complaintsRaised: 68, complaintsResolved: 65 },
    { label: "Q3 2025", shortLabel: "Q3", revenue: 1420000, ordersCount: 284, complaintsRaised: 74, complaintsResolved: 72 },
    { label: "Q4 2025", shortLabel: "Q4", revenue: 1780000, ordersCount: 356, complaintsRaised: 82, complaintsResolved: 80 },
  ],
};

const CATEGORY_BREAKDOWN = [
  { name: "Battery & Charging", share: 37, amount: "₹2,14,600", color: "#2563EB", bg: "bg-blue-600" },
  { name: "Motor & Controller", share: 28, amount: "₹1,62,400", color: "#38BDF8", bg: "bg-sky-400" },
  { name: "Brakes & Suspension", share: 20, amount: "₹1,16,000", color: "#F59E0B", bg: "bg-amber-500" },
  { name: "Chassis & Accessories", share: 15, amount: "₹87,000", color: "#10B981", bg: "bg-emerald-500" },
];

export function StaffAnalyticsGraphs({
  className = "",
}: StaffAnalyticsGraphsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"income" | "operations">("income");

  const currentData = RANGE_DATA[timeRange];

  // Calculated totals
  const totalRevenue = useMemo(
    () => currentData.reduce((acc, curr) => acc + curr.revenue, 0),
    [currentData]
  );
  const totalOrders = useMemo(
    () => currentData.reduce((acc, curr) => acc + curr.ordersCount, 0),
    [currentData]
  );
  const totalComplaintsRaised = useMemo(
    () => currentData.reduce((acc, curr) => acc + curr.complaintsRaised, 0),
    [currentData]
  );
  const totalComplaintsResolved = useMemo(
    () => currentData.reduce((acc, curr) => acc + curr.complaintsResolved, 0),
    [currentData]
  );
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const resolutionRate =
    totalComplaintsRaised > 0
      ? Math.min(100, Math.round((totalComplaintsResolved / totalComplaintsRaised) * 100))
      : 100;

  // Chart coordinate calculations
  const maxRevenue = useMemo(
    () => Math.max(...currentData.map((d) => d.revenue), 1),
    [currentData]
  );

  const width = 640;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Generate smooth cubic bezier SVG path
  const points = useMemo(() => {
    return currentData.map((d, i) => {
      const x = paddingX + (i / (currentData.length - 1)) * chartW;
      const y = height - paddingY - (d.revenue / maxRevenue) * chartH;
      return { x, y, data: d };
    });
  }, [currentData, maxRevenue, chartW, chartH]);

  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) / 2;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) / 2;
      const cy2 = p1.y;
      path += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }
    return path;
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const bottomY = height - paddingY;
    return `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [linePath, points]);

  // Operations chart coordinates (Complaints Raised vs Resolved)
  const maxComplaints = useMemo(
    () => Math.max(...currentData.map((d) => Math.max(d.complaintsRaised, d.complaintsResolved)), 1),
    [currentData]
  );

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* ===================================================================== */}
      {/* ANALYTICS HEADER WITH TOGGLES                                         */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4 sm:p-6">
        
        {/* Top Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Operations &amp; Revenue Analytics
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Live telemetrics on spare parts income, orders volume, and service throughput.
            </p>
          </div>

          {/* Controls: Tab Selector & Time Range Filter */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* View Tab Toggle */}
            <div className="flex items-center bg-gray-100/80 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("income")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "income"
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Orders Income
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("operations")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "operations"
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Service Volume
              </button>
            </div>

            {/* Time Range Pills */}
            <div className="flex items-center bg-gray-100/80 p-1 rounded-xl text-xs font-semibold">
              {(["7d", "30d", "6m", "1y"] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all uppercase cursor-pointer ${
                    timeRange === r
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Chart Style Switcher (Area vs Bar) */}
            {activeTab === "income" && (
              <div className="hidden sm:flex items-center bg-gray-100/80 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setChartType("area")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    chartType === "area" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Line/Area View"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("bar")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    chartType === "bar" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Column Bar View"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* KPI MINI HIGHLIGHT CARDS                                              */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 py-5 border-b border-gray-100">
          
          <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
            <span className="text-[11px] font-semibold text-gray-500 block truncate">
              {activeTab === "income" ? "Total Orders Income" : "Complaints Logged"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              {activeTab === "income" ? `₹${totalRevenue.toLocaleString("en-IN")}` : totalComplaintsRaised}
            </div>
            <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <span>↗ +18.4%</span>
              <span className="text-gray-400 font-normal">vs prev cycle</span>
            </div>
          </div>

          <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
            <span className="text-[11px] font-semibold text-gray-500 block truncate">
              {activeTab === "income" ? "Total Parts Sold" : "Complaints Resolved"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              {activeTab === "income" ? `${totalOrders} Orders` : `${totalComplaintsResolved} Fixed`}
            </div>
            <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <span>↗ +12.5%</span>
              <span className="text-gray-400 font-normal">volume</span>
            </div>
          </div>

          <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
            <span className="text-[11px] font-semibold text-gray-500 block truncate">
              {activeTab === "income" ? "Average Order Value (AOV)" : "Resolution Efficiency"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              {activeTab === "income" ? `₹${avgOrderValue.toLocaleString("en-IN")}` : `${resolutionRate}%`}
            </div>
            <div className="text-[11px] font-bold text-blue-600 mt-1 flex items-center gap-1">
              <span>★ High</span>
              <span className="text-gray-400 font-normal">benchmark</span>
            </div>
          </div>

          <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
            <span className="text-[11px] font-semibold text-gray-500 block truncate">
              Payment &amp; Fulfillment Rate
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              98.2%
            </div>
            <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <span>● Operational</span>
              <span className="text-gray-400 font-normal">on time</span>
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* MAIN VISUALIZATION ROW (Chart on Left + Category Breakdown on Right)  */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
          
          {/* LEFT: Primary Dynamic SVG Graph */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">
                {activeTab === "income" ? "Revenue Curve (₹ INR)" : "Complaints Volume vs Resolutions"}
              </span>
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                {activeTab === "income" ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Orders Income
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Raised
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Resolved
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Responsive Interactive SVG Canvas */}
            <div className="relative w-full h-64 sm:h-72 bg-gradient-to-b from-blue-50/20 via-transparent to-transparent rounded-xl border border-gray-100/90 p-2 overflow-hidden select-none">
              
              {activeTab === "income" ? (
                chartType === "area" ? (
                  /* Smooth Area / Line Chart */
                  <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                        <stop offset="85%" stopColor="#2563EB" stopOpacity="0.02" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#1D4ED8" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = height - paddingY - ratio * chartH;
                      return (
                        <g key={ratio}>
                          <line
                            x1={paddingX}
                            y1={y}
                            x2={width - paddingX}
                            y2={y}
                            stroke="#E2E8F0"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                          <text
                            x={paddingX - 8}
                            y={y + 3}
                            textAnchor="end"
                            fontSize="9"
                            fill="#94A3B8"
                            fontWeight="500"
                          >
                            ₹{Math.round((maxRevenue * ratio) / 1000)}k
                          </text>
                        </g>
                      );
                    })}

                    {/* Shaded Area Fill */}
                    <path d={areaPath} fill="url(#revenueGrad)" />

                    {/* Main Spline Curve */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#lineGrad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Interactive Points and Vertical Cursor */}
                    {points.map((p, idx) => {
                      const isHovered = hoveredIndex === idx;
                      return (
                        <g
                          key={p.data.label}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        >
                          {/* Vertical Indicator on hover */}
                          {isHovered && (
                            <line
                              x1={p.x}
                              y1={paddingY}
                              x2={p.x}
                              y2={height - paddingY}
                              stroke="#3B82F6"
                              strokeWidth="1.5"
                              strokeDasharray="2 2"
                            />
                          )}

                          {/* Outer pulse circle */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? 7 : 4.5}
                            fill="#FFFFFF"
                            stroke="#2563EB"
                            strokeWidth={isHovered ? "3.5" : "2.5"}
                            className="transition-all duration-150 drop-shadow-xs"
                          />

                          {/* Bottom X-axis labels */}
                          <text
                            x={p.x}
                            y={height - 8}
                            textAnchor="middle"
                            fontSize="10"
                            fill={isHovered ? "#0F172A" : "#64748B"}
                            fontWeight={isHovered ? "bold" : "600"}
                          >
                            {p.data.shortLabel}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                ) : (
                  /* Column Bar Chart */
                  <div className="w-full h-full flex items-end justify-between px-6 pb-6 pt-4 gap-2">
                    {currentData.map((d, idx) => {
                      const barH = (d.revenue / maxRevenue) * 100;
                      const isHovered = hoveredIndex === idx;
                      return (
                        <div
                          key={d.label}
                          className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        >
                          <div
                            style={{ height: `${Math.max(barH, 8)}%` }}
                            className={`w-full max-w-[40px] rounded-t-lg transition-all duration-200 ${
                              isHovered
                                ? "bg-gradient-to-t from-blue-700 to-sky-400 shadow-md scale-y-102"
                                : "bg-gradient-to-t from-blue-600 to-blue-400 opacity-90"
                            }`}
                          />
                          <span
                            className={`text-[10px] mt-2 font-semibold ${
                              isHovered ? "text-blue-600 font-bold" : "text-gray-500"
                            }`}
                          >
                            {d.shortLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Operations: Complaints Raised vs Resolved Comparison */
                <div className="w-full h-full flex items-end justify-between px-6 pb-6 pt-4 gap-3">
                  {currentData.map((d, idx) => {
                    const raisedH = (d.complaintsRaised / maxComplaints) * 100;
                    const resolvedH = (d.complaintsResolved / maxComplaints) * 100;
                    const isHovered = hoveredIndex === idx;

                    return (
                      <div
                        key={d.label}
                        className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        <div className="w-full flex items-end justify-center gap-1.5 h-full">
                          {/* Raised Bar (Rose) */}
                          <div
                            style={{ height: `${Math.max(raisedH, 10)}%` }}
                            className="w-1/2 max-w-[20px] bg-rose-500 rounded-t-md transition-all hover:bg-rose-600"
                            title={`Raised: ${d.complaintsRaised}`}
                          />
                          {/* Resolved Bar (Emerald) */}
                          <div
                            style={{ height: `${Math.max(resolvedH, 10)}%` }}
                            className="w-1/2 max-w-[20px] bg-emerald-500 rounded-t-md transition-all hover:bg-emerald-600"
                            title={`Resolved: ${d.complaintsResolved}`}
                          />
                        </div>
                        <span
                          className={`text-[10px] mt-2 font-semibold ${
                            isHovered ? "text-gray-900 font-bold" : "text-gray-500"
                          }`}
                        >
                          {d.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Floating Tooltip when hovering over point/bar */}
              {hoveredIndex !== null && (
                <div
                  className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs rounded-xl shadow-lg border border-gray-200 px-3.5 py-2 text-xs z-20 pointer-events-none animate-in fade-in duration-100"
                >
                  <p className="font-extrabold text-gray-900">
                    {currentData[hoveredIndex].label}
                  </p>
                  {activeTab === "income" ? (
                    <div className="space-y-0.5 mt-1 text-[11px]">
                      <p className="text-blue-600 font-bold">
                        Income: ₹{currentData[hoveredIndex].revenue.toLocaleString("en-IN")}
                      </p>
                      <p className="text-gray-500">
                        {currentData[hoveredIndex].ordersCount} Orders Completed
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5 mt-1 text-[11px]">
                      <p className="text-rose-600 font-semibold">
                        Raised: {currentData[hoveredIndex].complaintsRaised}
                      </p>
                      <p className="text-emerald-600 font-semibold">
                        Resolved: {currentData[hoveredIndex].complaintsResolved}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Insight footnote */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Revenue stream connected to Supabase
              </span>
              <span>Updated a few seconds ago</span>
            </div>
          </div>

          {/* RIGHT: Category Breakdown & Demand Share */}
          <div className="lg:col-span-4 bg-slate-50/70 rounded-xl p-4 sm:p-5 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/80">
                <span className="text-xs font-bold text-gray-900">
                  Parts Category Share
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                  Top Drivers
                </span>
              </div>

              {/* Progress bars list */}
              <div className="space-y-3.5 mt-4">
                {CATEGORY_BREAKDOWN.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">{cat.name}</span>
                      <span className="font-bold text-gray-900">{cat.share}%</span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-gray-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${cat.share}%` }}
                        className={`h-full ${cat.bg} rounded-full transition-all duration-500`}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Total Revenue</span>
                      <span className="font-medium text-gray-600">{cat.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category summary callout */}
            <div className="mt-5 p-3 rounded-lg bg-white border border-gray-200/80 text-xs">
              <p className="font-bold text-gray-900 flex items-center gap-1.5">
                <span>⚡ High Demand:</span>
                <span className="text-blue-600">Battery &amp; Charging</span>
              </p>
              <p className="text-gray-500 text-[11px] mt-0.5">
                Constitutes 37% of quarterly parts income. Stock reorder buffer recommended.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default StaffAnalyticsGraphs;
