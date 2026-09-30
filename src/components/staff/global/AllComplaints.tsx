"use client";

import React, { useEffect, useState } from "react";
import { EmptyStateCard } from "./EmptyStateCard";
import { COMPLAINT_CATEGORIES } from "./RegisterComplaint";
import { CustomSelect } from "./CustomSelect";
import {
  loadComplaints as loadSharedComplaints,
  saveComplaints as persistSharedComplaints,
  subscribeComplaints,
  type ComplaintStatus,
  type SharedComplaint,
} from "@/lib/complaintsStore";

// Kept for compatibility (same shape as the shared store type).
export type ComplaintItem = SharedComplaint;

const STATUS_OPTIONS: { value: ComplaintStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

/** Formal status-update email draft for the customer (opens in mail app). */
export function complaintStatusEmail(item: SharedComplaint): { subject: string; body: string } {
  const subject = `Your complaint ${item.id} — ${item.status}`;
  const body = [
    `Dear ${item.customerName || "Customer"},`,
    ``,
    `This is an update from Sutlej Automotives regarding your service request.`,
    ``,
    `Complaint ID : ${item.id}`,
    `Vehicle      : ${item.vehicleRegistrationNo}${item.model ? ` (${item.model})` : ""}`,
    `Category     : ${item.category}`,
    `Status       : ${item.status}`,
    ``,
    item.status === "resolved" || item.status === "closed"
      ? `Our team has completed the work. Please reply to this email if anything still needs attention.`
      : `Our team is working on it. We will notify you when the status changes.`,
    ``,
    `Thank you for choosing Sutlej Automotives.`,
    `Staff Service Desk`,
  ].join("\n");
  return { subject, body };
}

/** Formal status-update email draft (opens the staff mail app). */
function EmailComplaintButton({ item }: { item: SharedComplaint }) {
  const { subject, body } = complaintStatusEmail(item);
  const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return (
    <a
      href={href}
      title="Email status update to customer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 hover:border-[#E8A33D] text-slate-600 hover:text-[#8C5209] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
    >
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 6L2 7" />
      </svg>
      Email
    </a>
  );
}

export function AllComplaints() {
  // Shared store: status edits here appear in the customer portal too,
  // and new complaints arrive live without refresh.
  const [complaints, setComplaints] = useState<SharedComplaint[]>(loadSharedComplaints);

  useEffect(
    () => subscribeComplaints(() => setComplaints(loadSharedComplaints())),
    []
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handleStatusChange = (id: string, status: ComplaintStatus) => {
    const updated = complaints.map((c) => (c.id === id ? { ...c, status } : c));
    setComplaints(updated);
    persistSharedComplaints(updated);
  };

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
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, vehicle no. or ID..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200/90 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/25 transition-all shadow-xs"
            />
          </div>

          {/* Modern Status Filter Dropdown */}
          <div className="w-full sm:w-44 shrink-0">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All statuses" },
                { value: "open", label: "Open", dotColor: "amber" },
                { value: "in-progress", label: "In progress", dotColor: "sky" },
                { value: "resolved", label: "Resolved", dotColor: "emerald" },
                { value: "closed", label: "Closed", dotColor: "slate" },
              ]}
              size="md"
              className="w-full"
            />
          </div>

          {/* Modern Category Filter Dropdown */}
          <div className="w-full sm:w-56 shrink-0">
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
          /* Complaints Table (desktop) / Cards (mobile) when complaints exist */
          <>
            <div className="hidden md:block bg-white rounded-lg border border-gray-200/90 shadow-sm overflow-hidden">
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
                    <th className="py-3.5 px-4 text-right">Actions</th>
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
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-36">
                            <CustomSelect
                              value={item.status}
                              onChange={(val) =>
                                handleStatusChange(item.id, val as ComplaintStatus)
                              }
                              options={STATUS_OPTIONS.map((s) => ({
                                value: s.value,
                                label: s.label,
                              }))}
                              size="sm"
                              className="w-full"
                            />
                          </div>
                          <EmailComplaintButton item={item} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-3">
              {filteredComplaints.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-gray-200/90 shadow-sm p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-xs text-[#008CEE]">
                      {item.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize whitespace-nowrap ${
                        item.status === "open"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : item.status === "in-progress"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <div className="font-medium text-sm text-slate-900">
                      {item.customerName}
                    </div>
                    <div className="text-xs text-slate-400">{item.phoneNumber}</div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono uppercase font-semibold text-slate-800">
                      {item.vehicleRegistrationNo}
                    </span>
                    <span className="text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600 truncate">
                      {item.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                        item.priority === "High" || item.priority === "Critical / Urgent"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : item.priority === "Medium"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1">
                      <CustomSelect
                        value={item.status}
                        onChange={(val) =>
                          handleStatusChange(item.id, val as ComplaintStatus)
                        }
                        options={STATUS_OPTIONS.map((s) => ({
                          value: s.value,
                          label: s.label,
                        }))}
                        size="sm"
                        className="w-full"
                      />
                    </div>
                    <EmailComplaintButton item={item} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AllComplaints;
