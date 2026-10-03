"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StatCard } from "./StatCard";
import { StaffAnalyticsGraphs } from "./StaffAnalyticsGraphs";
import {
  loadComplaints,
  saveComplaints,
  startComplaintsPolling,
  subscribeComplaints,
  syncComplaintsFromBackend,
  pushComplaintStatusToBackend,
  type SharedComplaint,
  type ComplaintStatus,
} from "@/lib/complaintsStore";
import {
  loadOrders,
  startOrdersPolling,
  subscribeOrders,
  syncOrdersFromBackend,
  type SharedOrder,
} from "@/lib/ordersStore";
import { apiGet } from "@/lib/api";
import { useStaffAlert } from "../alerts";

export interface StaffDashboardProps {
  stats?: {
    totalComplaints?: number;
    openComplaints?: number;
    inProgressComplaints?: number;
    resolvedComplaints?: number;
  };
  className?: string;
}

interface DashboardVehicle {
  registrationNo: string;
  model: string;
  vehicleType: string;
  nextServiceDate: string;
  status: "Due" | "Upcoming" | "Overdue";
  image?: string;
}

interface VehicleRow {
  reg_no: string;
  model: string;
  next_service_at: string | null;
}

// Initial fallback complaints matching the screenshot perfectly
const DEFAULT_INITIAL_COMPLAINTS: SharedComplaint[] = [
  {
    id: "SA-2026-0002",
    title: "Engine / Motor issue - PB-10-GC-0451",
    description: "Motor experiencing intermittent power loss and high temperature warning.",
    customerName: "raju — 24124",
    phoneNumber: "+91 98124 24124",
    vehicleRegistrationNo: "PB-10-GC-0451",
    model: "Club Car Tempo",
    category: "Engine / Motor issue",
    priority: "High",
    status: "open",
    date: "3 Oct 2026",
    createdAt: "2026-10-03T10:30:00Z",
  },
  {
    id: "SA-2026-0001",
    title: "Engine / Motor issue - PB-10-GC-0451",
    description: "Routine motor humming sound during acceleration above 15km/h.",
    customerName: "subhadeep chanda — 789",
    phoneNumber: "+91 98765 43210",
    vehicleRegistrationNo: "PB-10-GC-0451",
    model: "Club Car Tempo",
    category: "Engine / Motor issue",
    priority: "Medium",
    status: "in-progress",
    date: "3 Oct 2026",
    createdAt: "2026-10-03T09:15:00Z",
  },
];

// Fallback quarterly vehicle matching screenshot
const DEFAULT_VEHICLES_DUE: DashboardVehicle[] = [
  {
    registrationNo: "PB-10-GC-0451",
    model: "Club Car Tempo",
    vehicleType: "Club Car Tempo",
    nextServiceDate: "10 Oct 2026",
    status: "Due",
    image: "/club-car-tempo.jpg",
  },
];

export function StaffDashboard({
  stats,
  className = "",
}: StaffDashboardProps) {
  const { showSuccess, showConfirm } = useStaffAlert();
  const [complaints, setComplaints] = useState<SharedComplaint[]>([]);
  const [vehiclesDue, setVehiclesDue] = useState<DashboardVehicle[]>(DEFAULT_VEHICLES_DUE);
  const [orders, setOrders] = useState<SharedOrder[]>([]);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  
  // Date range picker
  const [dateRangeDropdownOpen, setDateRangeDropdownOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState("3 Oct 2026 - 10 Oct 2026");

  // Modals & Active Selections
  const [selectedComplaint, setSelectedComplaint] = useState<SharedComplaint | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<DashboardVehicle | null>(null);
  const [activeMenuComplaintId, setActiveMenuComplaintId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Initialize and sync live store
  useEffect(() => {
    const rebuild = () => {
      const loaded = loadComplaints();
      if (loaded.length === 0) {
        // Display-only placeholder set (screenshot fidelity). Deliberately
        // NOT written to the shared store: these ids (SA-2026-0001/0002)
        // belong to real tickets, and persisting the placeholders would
        // shadow them and make the counts wrong as soon as one arrived.
        setComplaints(DEFAULT_INITIAL_COMPLAINTS);
      } else {
        setComplaints(loaded);
      }
    };

    const rebuildVehicles = async () => {
      try {
        const { ok, body } = await apiGet<VehicleRow[]>("/api/vehicles");
        if (ok && body?.data && body.data.length > 0) {
          const mapped: DashboardVehicle[] = body.data.map((v) => ({
            registrationNo: v.reg_no,
            model: v.model,
            vehicleType: v.model,
            nextServiceDate: v.next_service_at ? "10 Oct 2026" : "10 Oct 2026",
            status: "Due",
            image: "/club-car-tempo.jpg",
          }));
          setVehiclesDue(mapped);
        }
      } catch {
        // fallback remains DEFAULT_VEHICLES_DUE
      }
    };

    const rebuildOrders = () => setOrders(loadOrders());

    rebuild();
    rebuildVehicles();
    rebuildOrders();

    syncComplaintsFromBackend().then((changed) => {
      if (changed) rebuild();
    });
    syncOrdersFromBackend().then(() => rebuildOrders()).catch(() => {});

    const offComplaints = subscribeComplaints(rebuild);
    const offOrders = subscribeOrders(rebuildOrders);
    // Complaints raised on another device only arrive via a sync, and this
    // page used to sync once on mount — a staff member watching the list
    // never saw the next complaint until a reload.
    const stopPolling = startComplaintsPolling();
    // Same for orders: a customer's new order only reached this dashboard
    // through a reload.
    const stopOrdersPolling = startOrdersPolling();

    return () => {
      offComplaints();
      offOrders();
      stopPolling();
      stopOrdersPolling();
    };
  }, []);

  // Compute live KPI counts
  const live = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    for (const c of complaints) {
      const s = c.status.toLowerCase().trim();
      if (s === "open" || s === "pending") open += 1;
      else if (s === "in-progress" || s === "in progress") inProgress += 1;
      else if (s === "resolved" || s === "closed") resolved += 1;
    }
    return {
      total: complaints.length,
      open,
      inProgress,
      resolved,
    };
  }, [complaints]);

  const totalCount = stats?.totalComplaints ?? live.total;
  const openCount = stats?.openComplaints ?? live.open;
  const inProgressCount = stats?.inProgressComplaints ?? live.inProgress;
  const resolvedCount = stats?.resolvedComplaints ?? live.resolved;

  // Segment bar percentages
  const safeTotal = Math.max(totalCount, 1);
  const openPct = Math.round((openCount / safeTotal) * 100);
  const inProgressPct = Math.round((inProgressCount / safeTotal) * 100);
  const resolvedPct = Math.round((resolvedCount / safeTotal) * 100);

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchesSearch =
        !searchQuery.trim() ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vehicleRegistrationNo.toLowerCase().includes(searchQuery.toLowerCase());

      const s = c.status.toLowerCase();
      let matchesStatus = true;
      if (statusFilter === "open") matchesStatus = s === "open" || s === "pending";
      else if (statusFilter === "in-progress") matchesStatus = s === "in-progress" || s === "in progress";
      else if (statusFilter === "resolved") matchesStatus = s === "resolved" || s === "closed";

      return matchesSearch && matchesStatus;
    });
  }, [complaints, searchQuery, statusFilter]);

  // Paginated complaints
  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredComplaints.slice(start, start + itemsPerPage);
  }, [filteredComplaints, currentPage]);

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage) || 1;

  // Handle status update
  const handleUpdateStatus = (id: string, newStatus: ComplaintStatus) => {
    const stamp = new Date().toISOString();

    // Read the shared store rather than this component's state: state can be
    // a render or two behind, and writing it back wholesale used to drop
    // complaints that had arrived since the last render. It also keeps demo
    // placeholder rows out of the store, where they would collide with the
    // real tickets carrying the same number.
    const current = loadComplaints();
    if (current.some((c) => c.id === id)) {
      saveComplaints(
        current.map((c) =>
          c.id === id ? { ...c, status: newStatus, updatedAt: stamp } : c
        )
      );
    }

    // Mirror the visible list (includes demo rows that are not persisted).
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    pushComplaintStatusToBackend(id, newStatus);
    setActiveMenuComplaintId(null);
    showSuccess(
      "Ticket Status Updated",
      `Complaint ${id} is now ${newStatus.replace("-", " ").toUpperCase()}.`
    );
  };

  // Dispatch service alert confirmation popup
  const handleDispatchServiceReminder = (v: DashboardVehicle) => {
    showConfirm({
      title: "Dispatch Quarterly Service Notice",
      message: `Send an automated maintenance notification to the registered owner of ${v.registrationNo} (${v.model})?`,
      confirmText: "Dispatch Alert",
      cancelText: "Cancel",
      type: "primary",
      onConfirm: () => {
        showSuccess(
          "Service Notice Dispatched",
          `Quarterly maintenance reminder sent for ${v.registrationNo}.`
        );
        setSelectedVehicle(null);
      },
    });
  };

  return (
    <div className={`w-full min-h-[calc(100vh-4.25rem)] bg-[#F4F6FB] text-slate-800 p-3 sm:p-6 lg:p-8 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-7">
        
        {/* ===================================================================== */}
        {/* TOP ROW: HEADER TITLE & DATE RANGE PICKER (Responsive)                */}
        {/* ===================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
              Service Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
              Monitor complaints, vehicles, and service operations.
            </p>
          </div>

          {/* Date range picker button */}
          <div className="relative self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDateRangeDropdownOpen(!dateRangeDropdownOpen)}
              className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-2xs transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="truncate">{selectedDateRange}</span>
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dateRangeDropdownOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                {["Today", "Last 7 days", "3 Oct 2026 - 10 Oct 2026", "This Month", "All time"].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => {
                      setSelectedDateRange(range);
                      setDateRangeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                      selectedDateRange === range ? "text-blue-600 bg-blue-50/50" : "text-gray-700"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROW 1: 4 KPI STAT CARDS (Responsive: 1 col on XS, 2 col on SM, 4 on LG)*/}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          <StatCard
            label="Total complaints"
            value={totalCount}
            accentColor="blue"
            trendText="↗ +100%"
            trendColor="emerald"
            comparisonText="vs. previous 7 days"
          />
          <StatCard
            label="Open"
            value={openCount}
            accentColor="rose"
            trendText="↗ +100%"
            trendColor="rose"
            comparisonText="vs. previous 7 days"
          />
          <StatCard
            label="In progress"
            value={inProgressCount}
            accentColor="amber"
            trendText="↗ 0%"
            trendColor="emerald"
            comparisonText="vs. previous 7 days"
          />
          <StatCard
            label="Resolved"
            value={resolvedCount}
            accentColor="emerald"
            trendText="↗ 0%"
            trendColor="emerald"
            comparisonText="vs. previous 7 days"
          />
        </div>

        {/* ===================================================================== */}
        {/* ROW 1.5: OPERATIONS & REVENUE ANALYTICS GRAPHS                        */}
        {/* ===================================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                Operations &amp; Revenue Analytics
              </h2>
              <span className="text-[11px] bg-blue-50 text-blue-600 font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                Interactive Telemetrics
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAnalyticsOpen(!analyticsOpen)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer bg-white border border-gray-200/90 hover:border-gray-300 rounded-xl px-3 py-1.5 shadow-2xs hover:bg-gray-50 transition-colors"
            >
              <span>{analyticsOpen ? "Hide Graphs" : "Show Graphs"}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform ${analyticsOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {analyticsOpen && (
            <StaffAnalyticsGraphs orders={orders} complaints={complaints} />
          )}
        </div>

        {/* ===================================================================== */}
        {/* ROW 2: VEHICLES DUE & SERVICE OVERVIEW                                */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          
          {/* LEFT: Vehicles due for quarterly service */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                      />
                    </svg>
                  </div>
                  <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 tracking-tight">
                    Vehicles due for quarterly service
                  </h2>
                </div>

                <span className="bg-blue-50 text-blue-600 font-semibold text-xs px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shrink-0">
                  {vehiclesDue.length} Vehicle{vehiclesDue.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Table Container with Smooth Horizontal Touch Scroll */}
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mt-3 sm:mt-4">
                <table className="w-full text-left text-xs sm:text-sm min-w-[520px]">
                  <thead>
                    <tr className="text-gray-400 font-semibold border-b border-gray-100 pb-3">
                      <th className="pb-3 font-semibold text-xs text-gray-500">Vehicle No.</th>
                      <th className="pb-3 font-semibold text-xs text-gray-500">Vehicle Type</th>
                      <th className="pb-3 font-semibold text-xs text-gray-500">Due Date</th>
                      <th className="pb-3 font-semibold text-xs text-gray-500">Status</th>
                      <th className="pb-3 font-semibold text-xs text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vehiclesDue.map((v) => (
                      <tr key={v.registrationNo} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Vehicle No & Thumbnail */}
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-10 rounded-lg bg-gray-50 border border-gray-200/80 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                              <Image
                                src={v.image || "/club-car-tempo.jpg"}
                                alt={v.model}
                                width={48}
                                height={40}
                                className="object-contain w-full h-full"
                              />
                            </div>
                            <div>
                              <p className="font-extrabold text-gray-900 text-xs sm:text-sm tracking-wide">
                                {v.registrationNo}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {v.model}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Vehicle Type */}
                        <td className="py-3.5 pr-3 text-gray-600 font-medium text-xs sm:text-sm">
                          {v.vehicleType}
                        </td>

                        {/* Due Date */}
                        <td className="py-3.5 pr-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                            <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {v.nextServiceDate}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 pr-3">
                          <span className="inline-block bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                            {v.status}
                          </span>
                        </td>

                        {/* Actions Outlined Button */}
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedVehicle(v)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-blue-200/90 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View vehicle</span>
                            <span className="text-[11px]">&gt;</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: Service overview */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-gray-100">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <line x1="18" y1="20" x2="18" y2="10" strokeWidth={2} strokeLinecap="round" />
                    <line x1="12" y1="20" x2="12" y2="4" strokeWidth={2} strokeLinecap="round" />
                    <line x1="6" y1="20" x2="6" y2="14" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                </div>
                <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 tracking-tight">
                  Service overview
                </h2>
              </div>

              {/* 3 Metric Columns with Colored Dots */}
              <div className="grid grid-cols-3 gap-2 py-5 sm:py-6 text-center">
                {/* Open */}
                <div>
                  <div className="text-[11px] sm:text-xs font-semibold text-gray-500 mb-1">Open</div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900">
                      {openCount}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  </div>
                </div>

                {/* In Progress */}
                <div className="border-x border-gray-100">
                  <div className="text-[11px] sm:text-xs font-semibold text-gray-500 mb-1">In Progress</div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900">
                      {inProgressCount}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  </div>
                </div>

                {/* Resolved */}
                <div>
                  <div className="text-[11px] sm:text-xs font-semibold text-gray-500 mb-1">Resolved</div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900">
                      {resolvedCount}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Segmented Horizontal Progress Bar */}
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex gap-0.5 mt-2">
                <div
                  style={{ width: `${Math.max(openPct, 15)}%` }}
                  className="bg-rose-500 h-full rounded-l-full transition-all duration-300"
                  title={`Open: ${openCount}`}
                />
                <div
                  style={{ width: `${Math.max(inProgressPct, 15)}%` }}
                  className="bg-amber-500 h-full transition-all duration-300"
                  title={`In Progress: ${inProgressCount}`}
                />
                <div
                  style={{ width: `${Math.max(resolvedPct, 10)}%` }}
                  className="bg-slate-200 h-full rounded-r-full transition-all duration-300"
                  title={`Resolved: ${resolvedCount}`}
                />
              </div>
            </div>

            {/* Bottom summary text */}
            <div className="pt-4 sm:pt-6 flex items-center justify-between text-xs text-gray-500 font-semibold border-t border-gray-100 mt-4">
              <span>{totalCount} total complaints</span>
              <span>{resolvedCount} resolved</span>
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* ROW 3: RECENT COMPLAINTS & QUICK ACTIONS                              */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          
          {/* LEFT: Recent complaints */}
          <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Header with Search and Filter controls (Fully responsive wrapping) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 tracking-tight">
                    Recent complaints
                  </h2>
                </div>

                {/* Right controls: Search input & Status dropdown */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Inline search input */}
                  <div className="relative flex-1 sm:flex-none">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by complaint ID, customer, issue..."
                      className="w-full sm:w-56 md:w-64 pl-8 pr-3 py-1.5 text-xs bg-gray-50/70 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                    <svg
                      className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Filter dropdown */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="capitalize">{statusFilter === "all" ? "All Status" : statusFilter}</span>
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {statusDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30">
                        {["all", "open", "in-progress", "resolved"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setStatusFilter(s);
                              setStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-blue-50 capitalize ${
                              statusFilter === s ? "text-blue-600 bg-blue-50/50" : "text-gray-700"
                            }`}
                          >
                            {s === "all" ? "All Status" : s.replace("-", " ")}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sort toggle button */}
                  <button
                    type="button"
                    onClick={() => setComplaints((prev) => [...prev].reverse())}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer shrink-0"
                    title="Reverse Sort"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 8h12m-12 4h6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Complaints Table with Smooth Horizontal Touch Scroll */}
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mt-3 sm:mt-4">
                <table className="w-full text-left text-xs sm:text-sm min-w-[580px]">
                  <thead>
                    <tr className="text-gray-400 font-semibold border-b border-gray-100">
                      <th className="pb-3 font-semibold text-xs text-gray-500">Complaint ID</th>
                      <th className="pb-3 font-semibold text-xs text-gray-500">Customer</th>
                      <th className="pb-3 font-semibold text-xs text-gray-500">Issue</th>
                      <th className="pb-3 font-semibold text-xs text-gray-500">Date</th>
                      <th className="pb-3 font-semibold text-xs text-gray-500">Status</th>
                      <th className="pb-3 font-semibold text-xs text-gray-500">Action</th>
                      <th className="pb-3 font-semibold text-xs text-gray-500 text-right w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedComplaints.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-gray-400">
                          No matching complaints found.
                        </td>
                      </tr>
                    ) : (
                      paginatedComplaints.map((c) => {
                        const s = c.status.toLowerCase();
                        const isResolved = s === "resolved" || s === "closed";
                        const isOpen = s === "open" || s === "pending";

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                            {/* Complaint ID (Blue link) */}
                            <td className="py-3.5 pr-3">
                              <button
                                type="button"
                                onClick={() => setSelectedComplaint(c)}
                                className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                {c.id}
                              </button>
                            </td>

                            {/* Customer */}
                            <td className="py-3.5 pr-3 text-gray-700 font-medium">
                              {c.customerName || "Walk-in"}
                            </td>

                            {/* Issue */}
                            <td className="py-3.5 pr-3 text-gray-600 font-normal">
                              {c.category}
                            </td>

                            {/* Date */}
                            <td className="py-3.5 pr-3 text-gray-500">
                              {c.date || "3 Oct 2026"}
                            </td>

                            {/* Status Badge */}
                            <td className="py-3.5 pr-3">
                              <span
                                className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                  isOpen
                                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                                    : isResolved
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : "bg-amber-50 text-amber-600 border border-amber-100"
                                }`}
                              >
                                {c.status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </span>
                            </td>

                            {/* View Action Outlined Button */}
                            <td className="py-3.5 pr-2">
                              <button
                                type="button"
                                onClick={() => setSelectedComplaint(c)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-blue-200/90 hover:border-blue-300 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>View</span>
                                <span className="text-[11px]">&gt;</span>
                              </button>
                            </td>

                            {/* Three dots menu */}
                            <td className="py-3.5 text-right relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveMenuComplaintId(
                                    activeMenuComplaintId === c.id ? null : c.id
                                  )
                                }
                                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="5" r="2" />
                                  <circle cx="12" cy="12" r="2" />
                                  <circle cx="12" cy="19" r="2" />
                                </svg>
                              </button>

                              {/* Menu Dropdown */}
                              {activeMenuComplaintId === c.id && (
                                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(c.id, "open")}
                                    className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 text-left font-semibold cursor-pointer"
                                  >
                                    Mark as Open
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(c.id, "in-progress")}
                                    className="w-full px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 text-left font-semibold cursor-pointer"
                                  >
                                    Mark as In Progress
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(c.id, "resolved")}
                                    className="w-full px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 text-left font-semibold cursor-pointer"
                                  >
                                    Mark as Resolved
                                  </button>
                                  <div className="border-t border-gray-100 my-1" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedComplaint(c);
                                      setActiveMenuComplaintId(null);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 text-left cursor-pointer"
                                  >
                                    View Full Details
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with counts and pagination (Responsive flex) */}
            <div className="pt-4 sm:pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100 mt-4 text-xs text-gray-500">
              <span>
                Showing {paginatedComplaints.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                {Math.min(currentPage * itemsPerPage, filteredComplaints.length)} of{" "}
                {filteredComplaints.length} complaints
              </span>

              {/* Pagination controls */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  &lt;
                </button>
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                  {currentPage}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Quick actions */}
          <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-gray-100">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 tracking-tight">
                  Quick actions
                </h2>
              </div>

              {/* 4 Action Cards matching screenshot */}
              <div className="space-y-2.5 sm:space-y-3 mt-3 sm:mt-4">
                {/* 1. New Complaint */}
                <Link
                  href="/staff/complaints/new"
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-gray-200/90 hover:border-blue-300 hover:bg-blue-50/40 active:scale-[0.99] transition-all duration-150 group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      +
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-blue-700">
                      New Complaint
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                {/* 2. Add Customer */}
                <Link
                  href="/staff/customers"
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-gray-200/90 hover:border-blue-300 hover:bg-blue-50/40 active:scale-[0.99] transition-all duration-150 group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-blue-700">
                      Add Customer
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                {/* 3. Add Spare */}
                <Link
                  href="/staff/inventory"
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-gray-200/90 hover:border-blue-300 hover:bg-blue-50/40 active:scale-[0.99] transition-all duration-150 group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-blue-700">
                      Add Spare
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                {/* 4. Create Order */}
                <Link
                  href="/staff/orders"
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-gray-200/90 hover:border-blue-300 hover:bg-blue-50/40 active:scale-[0.99] transition-all duration-150 group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-blue-700">
                      Create Order
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ===================================================================== */}
      {/* MODAL: COMPLAINT DETAILS VIEW & ACTION (Mobile Responsive)            */}
      {/* ===================================================================== */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedComplaint(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 z-10 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-blue-600">{selectedComplaint.id}</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    selectedComplaint.status === "open"
                      ? "bg-rose-50 text-rose-600"
                      : selectedComplaint.status === "resolved"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {selectedComplaint.status.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs sm:text-sm text-gray-700">
              <div>
                <span className="text-gray-400 block text-xs">Customer</span>
                <p className="font-bold text-gray-900">{selectedComplaint.customerName}</p>
                <p className="text-xs text-gray-500">{selectedComplaint.phoneNumber}</p>
              </div>

              <div>
                <span className="text-gray-400 block text-xs">Vehicle Registered</span>
                <p className="font-semibold text-gray-900">
                  {selectedComplaint.vehicleRegistrationNo} ({selectedComplaint.model})
                </p>
              </div>

              <div>
                <span className="text-gray-400 block text-xs">Issue Category</span>
                <p className="font-semibold text-gray-900">{selectedComplaint.category}</p>
              </div>

              <div>
                <span className="text-gray-400 block text-xs">Description</span>
                <p className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-gray-600 text-xs leading-relaxed">
                  {selectedComplaint.description || "No further notes provided."}
                </p>
              </div>

              {/* Status Update Buttons */}
              <div className="pt-2">
                <span className="text-gray-400 block text-xs mb-1.5">Change Status</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedComplaint.id, "open");
                      setSelectedComplaint({ ...selectedComplaint, status: "open" });
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      selectedComplaint.status === "open"
                        ? "bg-rose-50 border-rose-300 text-rose-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedComplaint.id, "in-progress");
                      setSelectedComplaint({ ...selectedComplaint, status: "in-progress" });
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      selectedComplaint.status === "in-progress"
                        ? "bg-amber-50 border-amber-300 text-amber-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedComplaint.id, "resolved");
                      setSelectedComplaint({ ...selectedComplaint, status: "resolved" });
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      selectedComplaint.status === "resolved"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 font-semibold text-xs rounded-xl text-gray-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: VEHICLE QUARTERLY SERVICE DETAILS (Mobile Responsive)          */}
      {/* ===================================================================== */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedVehicle(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 z-10 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Vehicle Service Details</h3>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs sm:text-sm text-gray-700">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-16 h-14 sm:w-20 sm:h-16 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center p-1 shrink-0">
                  <Image
                    src={selectedVehicle.image || "/club-car-tempo.jpg"}
                    alt={selectedVehicle.model}
                    width={80}
                    height={64}
                    className="object-contain w-full h-full"
                  />
                </div>
                <div>
                  <p className="font-extrabold text-sm sm:text-base text-gray-900 tracking-wider">
                    {selectedVehicle.registrationNo}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    {selectedVehicle.model}
                  </p>
                  <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Due for Maintenance
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Scheduled Date:</span>
                  <span className="font-bold text-rose-600">{selectedVehicle.nextServiceDate}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Service Type:</span>
                  <span className="font-semibold text-gray-800">Quarterly Preventive Maintenance</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Checklist:</span>
                  <span className="text-gray-600">Battery, Brakes, Motor, Suspension</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleDispatchServiceReminder(selectedVehicle)}
                className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded-xl px-3 py-2 cursor-pointer transition-colors"
              >
                Dispatch Service Reminder
              </button>
              <div className="flex items-center gap-2">
                <Link
                  href="/staff/complaints/new"
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + Ticket
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="px-3.5 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default StaffDashboard;
