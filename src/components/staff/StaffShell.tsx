"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { StaffAlertProvider, useStaffAlert } from "./alerts";
import {
  loadComplaints,
  subscribeComplaints,
  type SharedComplaint,
} from "@/lib/complaintsStore";
import { apiPost } from "@/lib/api";
import { reportUnauthorized } from "@/lib/session";
import {
  loadOrders,
  subscribeOrders,
  type SharedOrder,
} from "@/lib/ordersStore";

export interface NavItem {
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
  isButton?: boolean;
}

export const STAFF_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/staff/dashboard",
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900"}`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="13" width="8" height="8" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
      </svg>
    ),
  },
  {
    label: "Customers",
    href: "/staff/customers",
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: "New Complaint",
    href: "/staff/complaints/new",
    isButton: true,
    icon: () => (
      <svg
        className="w-5 h-5 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    label: "All Complaints",
    href: "/staff/complaints",
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "Spares Inventory",
    href: "/staff/inventory",
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/staff/orders",
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "/staff/analytics",
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    ),
  },
  {
    label: "Announcements",
    href: "/staff/announcements",
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 11 18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    ),
  },
];

export interface StaffShellProps {
  children: React.ReactNode;
}

export function StaffShell({ children }: StaffShellProps) {
  return (
    <StaffAlertProvider>
      <StaffShellInner>{children}</StaffShellInner>
    </StaffAlertProvider>
  );
}

function StaffShellInner({ children }: StaffShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showConfirm, showSuccess } = useStaffAlert();

  // State management
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [staffName, setStaffName] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("staffName");
        if (stored) return stored;
      } catch {}
    }
    return "Staff";
  });

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResultsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
        setSettingsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    showConfirm({
      title: "Sign Out of Staff Desk",
      message: "Are you sure you want to log out from the Staff Service Desk? Any unsaved edits will be lost.",
      confirmText: "Yes, Sign Out",
      cancelText: "Stay Logged In",
      type: "danger",
      onConfirm: () => {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("staffName");
        }
        // Clear the httpOnly cookie — without this "Sign Out" only hid the
        // name badge and the next page still came back authenticated.
        apiPost("/api/auth/logout", {}).catch(() => {});
        reportUnauthorized();
        showSuccess("Signed Out", "You have been logged out of the staff desk.");
        router.push("/staff");
      },
    });
  };

  const isActive = (href: string) => {
    if (href === "/staff/dashboard") {
      return pathname === "/staff" || pathname === "/staff/dashboard";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const [complaints, setComplaints] = useState<SharedComplaint[]>([]);
  const [orders, setOrders] = useState<SharedOrder[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("staff_read_notif_ids");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [notifFilter, setNotifFilter] = useState<"all" | "unread" | "complaint" | "order">("all");

  // Listen to live complaints and orders stores
  useEffect(() => {
    const sync = () => {
      setComplaints(loadComplaints());
      setOrders(loadOrders());
    };
    sync();
    const offC = subscribeComplaints(sync);
    const offO = subscribeOrders(sync);
    return () => {
      offC();
      offO();
    };
  }, []);

  // Dynamic notifications combining live complaints, spare part orders, and quarterly services
  const notifications = useMemo(() => {
    const list: Array<{
      id: string;
      type: "complaint" | "order" | "maintenance";
      title: string;
      desc: string;
      time: string;
      urgent: boolean;
      link: string;
      unread: boolean;
    }> = [];

    // 1. Upcoming Quarterly Service Maintenance
    list.push({
      id: "notif-maint-0451",
      type: "maintenance",
      title: "Quarterly Service Due",
      desc: "Club Car Tempo (PB-10-GC-0451) is due for quarterly maintenance.",
      time: "Due 10 Oct 2026",
      urgent: true,
      link: "/staff/dashboard",
      unread: !readNotifIds.includes("notif-maint-0451"),
    });

    // 2. Pending or Open Customer Complaints
    for (const c of complaints) {
      const isUrgent = c.priority === "High" || c.priority === "Critical / Urgent";
      const isActionable = c.status === "open" || c.status === "pending";
      if (isActionable || isUrgent) {
        const notifId = `notif-cmp-${c.id}`;
        list.push({
          id: notifId,
          type: "complaint",
          title: `Ticket ${c.id}: ${c.category}`,
          desc: `${c.customerName || "Customer"} • ${c.vehicleRegistrationNo} • ${c.priority} Priority`,
          time: c.date || "Recent",
          urgent: isUrgent,
          link: "/staff/complaints",
          unread: !readNotifIds.includes(notifId),
        });
      }
    }

    // 3. Pending or Processing Spare Part Orders
    for (const o of orders) {
      if (o.status === "pending" || o.status === "processing") {
        const notifId = `notif-ord-${o.id}`;
        const count = o.items?.length || 1;
        const total = o.totalAmount ? `₹${o.totalAmount.toLocaleString("en-IN")}` : "";
        list.push({
          id: notifId,
          type: "order",
          title: `Spare Part Order ${o.id}`,
          desc: `${o.customerName || "Customer"} • ${count} item${count > 1 ? "s" : ""}${total ? ` • ${total}` : ""}`,
          time: o.status === "pending" ? "New Order" : "In Processing",
          urgent: o.status === "pending",
          link: "/staff/orders",
          unread: !readNotifIds.includes(notifId),
        });
      }
    }

    return list;
  }, [complaints, orders, readNotifIds]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...readNotifIds, ...allIds]));
    setReadNotifIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("staff_read_notif_ids", JSON.stringify(updated));
    }
    showSuccess("Notifications Updated", "All notifications marked as read.");
  };

  const handleMarkItemRead = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = Array.from(new Set([...readNotifIds, id]));
    setReadNotifIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("staff_read_notif_ids", JSON.stringify(updated));
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === "unread") return n.unread;
    if (notifFilter === "complaint") return n.type === "complaint";
    if (notifFilter === "order") return n.type === "order";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col text-slate-800 antialiased font-sans">
      {/* ========================================================================= */}
      {/* TOP HEADER BAR                                                            */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/90 shadow-2xs">
        <div className="w-full px-3 sm:px-6 lg:px-8 h-16 sm:h-17 flex items-center justify-between gap-2 sm:gap-6">
          
          {/* LEFT: Mobile Menu Button + Sutlej Automotives Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Brand Logo & Subtitle */}
            <Link href="/staff/dashboard" className="flex items-center gap-2 sm:gap-3 group focus:outline-none">
              {/* Circular Emblem Icon */}
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full drop-shadow-xs group-hover:scale-105 transition-transform"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="headerSutlejBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00A2FF" />
                      <stop offset="50%" stopColor="#008CEE" />
                      <stop offset="100%" stopColor="#006CD0" />
                    </linearGradient>
                  </defs>
                  {/* Outer Ring */}
                  <circle cx="50" cy="50" r="46" stroke="#38BDF8" strokeWidth="3" opacity="0.8" />
                  {/* Inner Disc */}
                  <circle cx="50" cy="50" r="39" fill="url(#headerSutlejBlue)" />
                  {/* Flowing White 'S' Wave */}
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

              {/* Brand Typography */}
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-base font-extrabold tracking-wider text-[#0F172A] leading-tight truncate">
                  SUTLEJ AUTOMOTIVES
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-gray-500 leading-tight">
                  Staff Service Desk
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER: Desktop & Tablet Search Bar */}
          <div className="flex-1 max-w-xl mx-2 hidden md:block" ref={searchRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchResultsOpen(e.target.value.trim().length > 0);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setSearchResultsOpen(true);
                }}
                placeholder="Search complaints, vehicles, customers..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 transition-all"
              />

              {/* Search Suggestions Dropdown */}
              {searchResultsOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Quick Results
                  </div>
                  <Link
                    href="/staff/complaints"
                    onClick={() => setSearchResultsOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 hover:bg-blue-50 text-xs text-gray-700 hover:text-blue-700 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                      SA
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">SA-2026-0002 · Engine / Motor issue</span>
                      <span className="text-[11px] text-gray-500">Customer: raju — 24124 (Open)</span>
                    </div>
                  </Link>
                  <Link
                    href="/staff/dashboard"
                    onClick={() => setSearchResultsOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 hover:bg-blue-50 text-xs text-gray-700 hover:text-blue-700 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                      VH
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">PB-10-GC-0451 · Club Car Tempo</span>
                      <span className="text-[11px] text-gray-500">Quarterly service due 10 Oct 2026</span>
                    </div>
                  </Link>
                  <Link
                    href="/staff/customers"
                    onClick={() => setSearchResultsOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 hover:bg-blue-50 text-xs text-gray-700 hover:text-blue-700 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                      CU
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">subhadeep chanda</span>
                      <span className="text-[11px] text-gray-500">PB 08 CX 5678 · Active Owner</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Mobile Search Toggle + Notifications + Profile + Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Search"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Notification Bell with Live Dynamic Badge */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`relative p-2 rounded-xl transition-all cursor-pointer ${
                  notificationsOpen
                    ? "bg-blue-50 text-blue-600 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                title={`Notifications (${unreadCount} unread)`}
                aria-label={`View notifications (${unreadCount} unread)`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>

                {/* Dynamic Red Badge with Pulse Animation for Unread Alerts */}
                {unreadCount > 0 ? (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-4 min-w-4 px-1 items-center justify-center bg-rose-600 text-white text-[10px] font-extrabold leading-none shadow-xs">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 opacity-80" title="All caught up" />
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200/90 py-0 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900">Notifications</span>
                      {unreadCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          {unreadCount} new
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                          All caught up
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-100 text-xs">
                    {(
                      [
                        { id: "all", label: `All (${notifications.length})` },
                        { id: "unread", label: `Unread (${unreadCount})` },
                        { id: "complaint", label: "Complaints" },
                        { id: "order", label: "Orders" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setNotifFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          notifFilter === tab.id
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Notification Items List */}
                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-10 px-4 text-center select-none">
                        <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-gray-800">
                          {notifFilter === "unread" ? "No unread alerts" : "No notifications in this tab"}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          You&apos;re completely up to date with service tickets and orders.
                        </p>
                      </div>
                    ) : (
                      filteredNotifications.map((n) => (
                        <div
                          key={n.id}
                          className={`relative group px-4 py-3 hover:bg-gray-50/80 transition-colors flex items-start gap-3 ${
                            n.unread ? "bg-blue-50/30" : "bg-white"
                          }`}
                        >
                          {/* Type Icon Badge */}
                          <div
                            className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${
                              n.type === "complaint"
                                ? n.urgent
                                  ? "bg-rose-100 text-rose-600"
                                  : "bg-amber-100 text-amber-700"
                                : n.type === "order"
                                ? "bg-sky-100 text-sky-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {n.type === "complaint" ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            ) : n.type === "order" ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <circle cx="12" cy="12" r="3" strokeWidth={2} />
                              </svg>
                            )}
                          </div>

                          {/* Content Details */}
                          <div className="flex-1 min-w-0">
                            <Link
                              href={n.link}
                              onClick={() => {
                                handleMarkItemRead(n.id);
                                setNotificationsOpen(false);
                              }}
                              className="block focus:outline-none"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <p className="text-xs font-bold text-gray-900 truncate hover:text-blue-600 transition-colors">
                                  {n.title}
                                </p>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                    n.urgent
                                      ? "bg-rose-100 text-rose-700"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {n.time}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                                {n.desc}
                              </p>
                            </Link>
                          </div>

                          {/* Unread Indicator & Mark Read Quick Action */}
                          <div className="flex items-center gap-1 shrink-0 pt-1">
                            {n.unread && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkItemRead(n.id, e)}
                                title="Mark as read"
                                className="w-5 h-5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </button>
                            )}
                            {n.unread && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Popover Footer Shortcuts */}
                  <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-xs">
                    <Link
                      href="/staff/complaints"
                      onClick={() => setNotificationsOpen(false)}
                      className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      All Complaints →
                    </Link>
                    <Link
                      href="/staff/orders"
                      onClick={() => setNotificationsOpen(false)}
                      className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      All Orders →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Staff Profile Pill (Blue circle with 'S', Staff, ● Active, Chevron) */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 sm:gap-2.5 px-1.5 sm:px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer select-none"
              >
                {/* Blue circle avatar with white 'S' */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                  {staffName.charAt(0).toUpperCase()}
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-gray-900 leading-tight">
                    {staffName}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 leading-tight flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>

                {/* Dropdown Chevron */}
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900">{staffName}</p>
                    <p className="text-[11px] text-gray-500">Service Desk Specialist</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      setSettingsModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Account Settings
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log out
                  </button>
                </div>
              )}
            </div>

            {/* Log out Button ([-> Log out) */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 px-2 sm:px-3.5 py-1.5 rounded-xl border border-gray-200/90 hover:border-gray-300 bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Log out"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>

        </div>

        {/* Collapsible Mobile Search Field */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaints, vehicles, customers..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="text-xs text-gray-500 font-semibold px-2 py-1"
            >
              Cancel
            </button>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* MAIN BODY: SIDEBAR + CONTENT AREA                                         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex w-full">
        {/* ======================================================================= */}
        {/* DESKTOP SIDEBAR                                                         */}
        {/* ======================================================================= */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 bg-white border-r border-gray-200/90 shrink-0 min-h-[calc(100vh-4.25rem)] sticky top-16 sm:top-17">
          <div className="flex-1 px-3.5 xl:px-4 py-5 space-y-1.5 overflow-y-auto">
            {STAFF_NAV_ITEMS.map((item) => {
              const active = isActive(item.href);

              // Standout primary '+ New Complaint' button
              if (item.isButton) {
                return (
                  <div key={item.label} className="pt-2 pb-2">
                    <Link
                      href={item.href}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors group cursor-pointer"
                    >
                      {item.icon(active)}
                      <span>{item.label}</span>
                    </Link>
                  </div>
                );
              }

              const openComplaintsCount = complaints.filter(
                (c) => c.status === "open" || c.status === "pending"
              ).length;
              const pendingOrdersCount = orders.filter(
                (o) => o.status === "pending" || o.status === "processing"
              ).length;

              // Standard sidebar navigation link
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 group cursor-pointer ${
                    active
                      ? "bg-blue-50 text-blue-600 font-bold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {item.icon(active)}
                  <span>{item.label}</span>
                  {item.label === "All Complaints" && openComplaintsCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {openComplaintsCount}
                    </span>
                  )}
                  {item.label === "Orders" && pendingOrdersCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      {pendingOrdersCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* SIDEBAR FOOTER (Settings, Sutlej Automotives, v1.0.0) */}
          <div className="p-4 border-t border-gray-100 space-y-3">
            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              className="flex items-center gap-2.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors w-full text-left cursor-pointer"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Settings</span>
            </button>

            <div className="text-[11px] text-gray-400">
              <p className="font-medium text-gray-500">Sutlej Automotives</p>
              <p>v1.0.0</p>
            </div>
          </div>
        </aside>

        {/* ======================================================================= */}
        {/* MOBILE SLIDE-OVER DRAWER                                                */}
        {/* ======================================================================= */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative flex-1 flex flex-col max-w-[280px] sm:max-w-xs w-full bg-white shadow-2xl py-4 z-50 animate-in slide-in-from-left duration-250">
              <div className="px-4 pb-3 flex items-center justify-between border-b border-gray-100">
                <span className="font-extrabold text-sm text-[#0F172A]">Staff Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
                {STAFF_NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  if (item.isButton) {
                    return (
                      <div key={item.label} className="pt-2 pb-2">
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs"
                        >
                          {item.icon(active)}
                          <span>{item.label}</span>
                        </Link>
                      </div>
                    );
                  }
                  const openComplaintsCount = complaints.filter(
                    (c) => c.status === "open" || c.status === "pending"
                  ).length;
                  const pendingOrdersCount = orders.filter(
                    (o) => o.status === "pending" || o.status === "processing"
                  ).length;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold ${
                        active
                          ? "bg-blue-50 text-blue-600 font-bold"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {item.icon(active)}
                      <span>{item.label}</span>
                      {item.label === "All Complaints" && openComplaintsCount > 0 && (
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {openComplaintsCount}
                        </span>
                      )}
                      {item.label === "Orders" && pendingOrdersCount > 0 && (
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                          {pendingOrdersCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="p-4 border-t border-gray-100 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSettingsModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Settings</span>
                </button>
                <div className="text-[11px] text-gray-400 pt-1">
                  <p className="font-medium text-gray-500">Sutlej Automotives</p>
                  <p>v1.0.0</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* MAIN CONTENT AREA                                                       */}
        {/* ======================================================================= */}
        <main className="flex-1 bg-[#F4F6FB] min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* QUICK SETTINGS MODAL                                                      */}
      {/* ========================================================================= */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSettingsModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Service Desk Settings</h3>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="py-4 space-y-4 text-xs sm:text-sm text-gray-600">
              <div>
                <label className="block font-semibold text-gray-800 mb-1">Active Staff Member</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => {
                    setStaffName(e.target.value);
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem("staffName", e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Version: Sutlej v1.0.0-staff</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> System Online
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSettingsModalOpen(false);
                  showSuccess("Settings Saved", `Staff display name set to "${staffName}".`);
                }}
                className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffShell;
