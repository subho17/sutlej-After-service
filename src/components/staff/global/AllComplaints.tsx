"use client";

import React, { useEffect, useState } from "react";
import { EmptyStateCard } from "./EmptyStateCard";
import { COMPLAINT_CATEGORIES } from "./RegisterComplaint";
import { CustomSelect } from "./CustomSelect";
import { apiPost } from "@/lib/api";
import {
  loadComplaints as loadSharedComplaints,
  pushComplaintStatusToBackend,
  saveComplaints as persistSharedComplaints,
  startComplaintsPolling,
  subscribeComplaints,
  syncComplaintsFromBackend,
  type ComplaintStatus,
  type SharedComplaint,
} from "@/lib/complaintsStore";

import { useStaffAlert } from "../alerts";

// Kept for compatibility (same shape as the shared store type).
export type ComplaintItem = SharedComplaint;

const STATUS_OPTIONS: { value: ComplaintStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
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
      : item.status === "pending"
      ? `We have received your request and our team will accept it shortly. We will notify you when the status changes.`
      : `Our team is working on it. We will notify you when the status changes.`,
    ``,
    `Thank you for choosing Sutlej Automotives.`,
    `Staff Service Desk`,
  ].join("\n");
  return { subject, body };
}

/** Formal status-update email draft for the customer. */
function mailtoDraft(item: SharedComplaint): string {
  const { subject, body } = complaintStatusEmail(item);
  const to = item.email ?? "";
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Email button: auto-sends the formal update through the backend when the
 * complaint has an email address (falls back to a mail-app draft otherwise,
 * e.g. when the API is unreachable or no address is on file).
 */
function EmailComplaintButton({ item }: { item: SharedComplaint }) {
  const { showSuccess, showInfo } = useStaffAlert();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "draft">("idle");

  const openDraft = () => {
    window.location.href = mailtoDraft(item);
    setState("draft");
    showInfo("Email Draft Opened", `Mail application opened with formal draft for ${item.id}.`);
  };

  const handleClick = async () => {
    if (!item.email) {
      openDraft();
      return;
    }
    setState("sending");
    try {
      const { subject, body } = complaintStatusEmail(item);
      const { ok } = await apiPost<unknown>("/api/complaints/notify", {
        to: item.email,
        subject,
        message: body,
      });
      if (!ok) throw new Error("send failed");
      setState("sent");
      showSuccess("Email Notification Sent", `Status update sent to ${item.email} for ticket ${item.id}.`);
    } catch {
      // Backend unreachable or mail service down: staff can still send manually.
      openDraft();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "sending"}
      title={
        item.email
          ? `Email status update to ${item.email}`
          : "No email on file — opens a draft instead"
      }
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 ${
        state === "sent"
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-slate-200 hover:border-[#E8A33D] text-slate-600 hover:text-[#8C5209]"
      }`}
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
      {state === "sending" ? "Sending..." : state === "sent" ? "Sent ✓" : state === "draft" ? "Draft opened" : "Email"}
    </button>
  );
}

export function AllComplaints() {
  const { showSuccess, showConfirm } = useStaffAlert();
  // Shared store: status edits here appear in the customer portal too,
  // and new complaints arrive live without refresh.
  const [complaints, setComplaints] = useState<SharedComplaint[]>(loadSharedComplaints);

  useEffect(() => {
    const rebuild = () => setComplaints(loadSharedComplaints());
    // Cross-device: pull tickets created on other devices, then rebuild.
    syncComplaintsFromBackend().then((changed) => {
      if (changed) rebuild();
    });
    // Keep polling while the list is open — a complaint raised on another
    // device used to need a manual reload to show up here.
    const stopPolling = startComplaintsPolling();
    const off = subscribeComplaints(rebuild);
    return () => {
      off();
      stopPolling();
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handleStatusChange = (id: string, status: ComplaintStatus) => {
    const applyStatus = () => {
      const stamp = new Date().toISOString();
      const current = loadSharedComplaints();
      persistSharedComplaints(
        current.map((c) =>
          c.id === id ? { ...c, status, updatedAt: stamp } : c
        )
      );
      // Cross-device: sync the status move to the backend (fire-and-forget).
      pushComplaintStatusToBackend(id, status);
      showSuccess("Status Updated", `Complaint ${id} updated to ${status.toUpperCase()}.`);
    };

    if (status === "closed") {
      showConfirm({
        title: "Close Complaint Ticket?",
        message: `Are you sure you want to mark ticket ${id} as Closed? Work should be completely verified.`,
        confirmText: "Close Ticket",
        cancelText: "Keep Active",
        type: "primary",
        onConfirm: applyStatus,
      });
    } else {
      applyStatus();
    }
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
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#F4F6FB] text-slate-800 p-4 sm:p-6 lg:p-8">
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
                  { value: "pending", label: "Pending", dotColor: "amber" },
                  { value: "open", label: "Open", dotColor: "rose" },
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
                      <th className="py-3.5 px-4">Description</th>
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
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-64">
                        <p className="truncate" title={item.description || "—"}>
                          {item.description || "—"}
                        </p>
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
                            item.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : item.status === "open"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : item.status === "in-progress"
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : item.status === "resolved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
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
                          {/* Native select: custom dropdown menus get clipped
                              by the table's horizontal scroll container. */}
                          <select
                            value={item.status}
                            onChange={(e) =>
                              handleStatusChange(item.id, e.target.value as ComplaintStatus)
                            }
                            aria-label={`Update status of ${item.id}`}
                            className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/25 cursor-pointer capitalize"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
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
                        item.status === "pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : item.status === "open"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : item.status === "in-progress"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : item.status === "resolved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
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

                  {item.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  )}

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
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleStatusChange(item.id, e.target.value as ComplaintStatus)
                      }
                      aria-label={`Update status of ${item.id}`}
                      className="flex-1 px-2.5 py-2 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/25 cursor-pointer capitalize"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
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
