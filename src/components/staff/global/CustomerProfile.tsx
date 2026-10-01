"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EmptyStateCard } from "./EmptyStateCard";
import { StatCard } from "./StatCard";
import {
  fetchBackendCustomers,
  findMergedDirectoryCustomer,
  type BackendCustomer,
  type DirectoryCustomer,
} from "@/lib/customersDirectory";
import { subscribeComplaints, syncComplaintsFromBackend } from "@/lib/complaintsStore";
import { subscribeOrders, syncOrdersFromBackend } from "@/lib/ordersStore";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  open: "bg-red-50 text-red-700 border-red-200",
  "in-progress": "bg-sky-50 text-sky-700 border-sky-200",
  processing: "bg-sky-50 text-sky-700 border-sky-200",
  dispatched: "bg-purple-50 text-purple-700 border-purple-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

function statusBadge(status: string): string {
  return STATUS_STYLES[status.toLowerCase()] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

export function CustomerProfile({ customerKey }: { customerKey: string }) {
  // SSR-safe: server renders the not-found state; client resolves after mount.
  const [customer, setCustomer] = useState<DirectoryCustomer | null>(null);
  const backendRef = useRef<BackendCustomer[]>([]);

  useEffect(() => {
    let cancelled = false;
    const refresh = (remote: BackendCustomer[]) =>
      setCustomer(findMergedDirectoryCustomer(customerKey, remote));
    refresh(backendRef.current);
    // Cross-device: pull records created on other devices, then rebuild.
    syncComplaintsFromBackend()
      .then(() => syncOrdersFromBackend())
      .then((changed) => {
        if (changed) refresh(backendRef.current);
      })
      .catch(() => {});
    fetchBackendCustomers().then((remote) => {
      if (cancelled) return;
      backendRef.current = remote;
      refresh(remote);
    });
    const resub = () => refresh(backendRef.current);
    const offComplaints = subscribeComplaints(resub);
    const offOrders = subscribeOrders(resub);
    return () => {
      cancelled = true;
      offComplaints();
      offOrders();
    };
  }, [customerKey]);

  if (!customer) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] bg-[#F3EEF5] p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Link
            href="/staff/customers"
            className="inline-block text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            ← All customers
          </Link>
          <EmptyStateCard
            title="Customer not found"
            description="This profile has no complaints or orders on record yet."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#F3EEF5] text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <Link
          href="/staff/customers"
          className="inline-block text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← All customers
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-amber-500 p-0.5 shrink-0">
            <div className="w-full h-full rounded-full bg-[#111621] flex items-center justify-center text-xl sm:text-2xl font-bold text-sky-300">
              {customer.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
              {customer.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm text-slate-500">
              {customer.phone && <span>{customer.phone}</span>}
              {customer.email && <span className="break-all">{customer.email}</span>}
              {customer.lastActive && <span>Last active: {customer.lastActive}</span>}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          <StatCard label="Vehicles" value={customer.vehicleRegNos.length} accentColor="slate" />
          <StatCard label="Complaints" value={customer.complaints.length} accentColor="rose" />
          <StatCard label="Orders" value={customer.orders.length} accentColor="amber" />
          <StatCard
            label="Total spent"
            value={`₹${customer.totalSpent.toLocaleString("en-IN")}`}
            accentColor="emerald"
          />
        </div>

        {/* Vehicles */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
            Vehicles ({customer.vehicleRegNos.length})
          </h3>
          {customer.vehicleRegNos.length === 0 ? (
            <EmptyStateCard
              title="No vehicles on record"
              description="Vehicles appear here once linked to this customer's complaints or orders."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {customer.vehicleRegNos.map((reg) => (
                <div
                  key={reg}
                  className="bg-white rounded-lg border border-gray-200/90 shadow-sm px-4 py-3.5"
                >
                  <div className="font-mono font-bold text-sm text-slate-900 uppercase">
                    {reg}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Registered vehicle</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaints */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
            Complaints ({customer.complaints.length})
          </h3>
          {customer.complaints.length === 0 ? (
            <EmptyStateCard title="No complaints" description="Nothing registered for this customer yet." />
          ) : (
            <div className="space-y-3">
              {customer.complaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-lg border border-gray-200/90 shadow-sm p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-xs text-[#008CEE]">{c.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${statusBadge(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {c.title || c.category}
                    <span className="text-slate-400 font-mono text-xs ml-2">{c.vehicleRegistrationNo}</span>
                  </div>
                  {c.description && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
            Orders ({customer.orders.length})
          </h3>
          {customer.orders.length === 0 ? (
            <EmptyStateCard title="No orders" description="Spare-part orders will appear here." />
          ) : (
            <div className="space-y-3">
              {customer.orders.map((o) => (
                <div
                  key={o.id}
                  className="bg-white rounded-lg border border-gray-200/90 shadow-sm p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-xs text-slate-900">{o.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${statusBadge(o.status)}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {o.items.map((it, i) => (
                      <span key={i}>
                        {it.partName} × {it.quantity}
                        {i < o.items.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    ₹{Number(o.totalAmount).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
            History ({customer.history.length})
          </h3>
          {customer.history.length === 0 ? (
            <EmptyStateCard title="No activity yet" description="Complaints and orders will be listed here newest first." />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200/90 shadow-sm divide-y divide-slate-100">
              {customer.history.map((h, i) => (
                <div key={i} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                      {h.text}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{h.date}</div>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${statusBadge(h.status)}`}
                  >
                    {h.status}
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

export default CustomerProfile;
