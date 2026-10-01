"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyStateCard } from "./EmptyStateCard";
import {
  buildCustomerDirectory,
  type DirectoryCustomer,
} from "@/lib/customersDirectory";
import { subscribeComplaints } from "@/lib/complaintsStore";
import { subscribeOrders } from "@/lib/ordersStore";

export function CustomersDirectory() {
  const [customers, setCustomers] = useState<DirectoryCustomer[]>(buildCustomerDirectory);
  const [searchTerm, setSearchTerm] = useState("");

  // Live sync: new complaints/orders reshape the directory instantly.
  useEffect(() => {
    const refresh = () => setCustomers(buildCustomerDirectory());
    const offComplaints = subscribeComplaints(refresh);
    const offOrders = subscribeOrders(refresh);
    return () => {
      offComplaints();
      offOrders();
    };
  }, []);

  const filtered = customers.filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#F3EEF5] text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Customers{" "}
            <span className="font-normal text-slate-500 text-base sm:text-lg">
              ({filtered.length})
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Click a customer to open their profile — vehicles, complaints, orders and history.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone or email..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200/90 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/25 transition-all shadow-xs"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-8">
            <EmptyStateCard
              title="No customers yet"
              description="Customers appear here once complaints or orders are registered for them."
            />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Vehicles</th>
                      <th className="py-3.5 px-4">Complaints</th>
                      <th className="py-3.5 px-4">Orders</th>
                      <th className="py-3.5 px-4">Total spent</th>
                      <th className="py-3.5 px-4">Last active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((c) => (
                      <tr key={c.key} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/staff/customers/${encodeURIComponent(c.key)}`}
                            className="font-medium text-slate-900 hover:text-[#008CEE] hover:underline"
                          >
                            {c.name}
                          </Link>
                          <div className="text-xs text-slate-400">{c.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                          {c.vehicleRegNos.length}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {c.complaints.length}
                          {c.openComplaints > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              {c.openComplaints} open
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">{c.orders.length}</td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                          ₹{c.totalSpent.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">{c.lastActive || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((c) => (
                <Link
                  key={c.key}
                  href={`/staff/customers/${encodeURIComponent(c.key)}`}
                  className="block bg-white rounded-lg border border-gray-200/90 shadow-sm p-4 space-y-2.5 active:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm text-slate-900">{c.name}</span>
                    {c.openComplaints > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                        {c.openComplaints} open
                      </span>
                    ) : (
                      <span className="text-slate-300 text-lg leading-none">›</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">{c.phone}</div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span>
                      <strong className="text-slate-900">{c.vehicleRegNos.length}</strong> vehicles
                    </span>
                    <span>
                      <strong className="text-slate-900">{c.complaints.length}</strong> complaints
                    </span>
                    <span>
                      <strong className="text-slate-900">{c.orders.length}</strong> orders
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CustomersDirectory;
