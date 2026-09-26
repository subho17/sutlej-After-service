"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EmptyStateCard } from "./EmptyStateCard";
import { COMPLAINT_CATEGORIES } from "./RegisterComplaint";
import { CustomSelect } from "./CustomSelect";

export interface ComplaintItem {
  id: string;
  title: string;
  description: string;
  customerName: string;
  phoneNumber: string;
  vehicleRegistrationNo: string;
  model?: string;
  category: string;
  priority: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  createdAt: string;
}

function loadComplaints(): ComplaintItem[] {
  if (typeof window === "undefined") return [];
  try {
    // Loaded from localStorage (populated by RegisterComplaint)
    const stored = localStorage.getItem("staffComplaints");
    return stored ? (JSON.parse(stored) as ComplaintItem[]) : [];
  } catch {
    // Fallback empty
    return [];
  }
}

export function AllComplaints() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>(loadComplaints);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Filter complaints
  const filteredComplaints = complaints.filter((item) => {
    const matchesSearch =
      !searchTerm.trim() ||
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phoneNumber.includes(searchTerm) ||
      item.vehicleRegistrationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#F3EEF5] text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          All complaints
        </h1>

        {/* Filter / Search Bar Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, vehicle no. or ID..."
              className="w-full px-3.5 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all shadow-sm"
            />
          </div>

          {/* Modern Status Filter Dropdown */}
          <div className="shrink-0 w-full sm:w-44">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All statuses" },
                { value: "open", label: "Open", dotColor: "bg-amber-500" },
                { value: "in-progress", label: "In progress", dotColor: "bg-sky-500" },
                { value: "resolved", label: "Resolved", dotColor: "bg-emerald-500" },
                { value: "closed", label: "Closed", dotColor: "bg-slate-400" },
              ]}
              size="md"
              className="w-full"
            />
          </div>

          {/* Modern Category Filter Dropdown */}
          <div className="shrink-0 w-full sm:w-56">
            <CustomSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "all", label: "All categories" },
                ...COMPLAINT_CATEGORIES.map((cat) => ({
                  value: cat,
                  label: cat,
                })),
              ]}
              size="md"
              className="w-full"
            />
          </div>
        </div>

        {/* Content Area */}
        {filteredComplaints.length === 0 ? (
          /* Empty State Matching Screenshot Exactly */
          <div className="py-8">
            <EmptyStateCard
              title="No complaints registered yet"
              description='Use "New Complaint" to register your first one.'
            />
          </div>
        ) : (
          /* Complaints Table/Cards when complaints exist */
          <div className="bg-white rounded-lg border border-gray-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Vehicle No.</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-xs text-[#008CEE]">
                        {item.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {item.customerName}
                        <div className="text-xs text-slate-400">{item.phoneNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs uppercase font-semibold text-slate-800">
                        {item.vehicleRegistrationNo}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] ${
                            item.priority === "High" || item.priority === "Critical / Urgent"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : item.priority === "Medium"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] capitalize ${
                            item.status === "open"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : item.status === "in-progress"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllComplaints;
