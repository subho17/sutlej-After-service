"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import {
  loadComplaints,
  nextComplaintTicketNo,
  normalizeComplaint,
  pushComplaintToBackend,
  saveComplaints,
  syncComplaintsFromBackend,
} from "@/lib/complaintsStore";
import { verifyCustomerSession } from "@/lib/ownership";

export interface VehicleOption {
  registrationNo: string;
  model: string;
}

const DEFAULT_VEHICLES: VehicleOption[] = [
  { registrationNo: "PB-10-GC-PT", model: "club car tempo" },
];

export const COMPLAINT_CATEGORIES = [
  "Engine / Motor issue",
  "Battery / Charging issue",
  "Brake / Suspension issue",
  "Electrical / Wiring issue",
  "Body / Chassis damage",
  "Routine Quarterly Service",
  "Other",
];

export const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical / Urgent"];

interface VehicleRow {
  reg_no: string;
  model: string;
}

export interface RaiseComplaintProps {
  className?: string;
  onSuccess?: (complaintId: string) => void;
}

/**
 * RaiseComplaint Global Component
 * Matches the official Sutlej Customer Portal 'Raise a complaint' form.
 * Features:
 * - Vehicle selector with auto-filling registration & model fields
 * - Category and priority pickers
 * - Description textarea
 * - Informational note & Submit button with validation and persistence
 */
export function RaiseComplaint({
  className = "",
  onSuccess,
}: RaiseComplaintProps) {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<VehicleOption[]>(DEFAULT_VEHICLES);

  useEffect(() => {
    let cancelled = false;
    apiGet<VehicleRow[]>("/api/vehicles")
      .then(({ ok, body }) => {
        if (cancelled || !ok || !body?.data || body.data.length === 0) return;
        setVehicles(
          body.data.map((v) => ({ registrationNo: v.reg_no, model: v.model }))
        );
      })
      .catch(() => {});
    // Warm the complaints cache: the ticket number we are about to mint
    // depends on which complaints already exist across all devices.
    syncComplaintsFromBackend().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);

  const currentVehicle = vehicles[selectedVehicleIndex] || vehicles[0] || {
    registrationNo: "PB-10-GC-PT",
    model: "club car tempo",
  };

  const [category, setCategory] = useState("Engine / Motor issue");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    setSelectedVehicleIndex(isNaN(idx) ? 0 : idx);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!description.trim()) {
      setError("Please describe the issue with your vehicle.");
      return;
    }

    setLoading(true);

    try {
      // A complaint must belong to an account. The backend only persists
      // authenticated submissions, so a signed-out visitor used to get a
      // "success" message for a complaint nobody ever received — and it was
      // filed under a shared placeholder number instead of their own.
      const session = await verifyCustomerSession();
      if (session.state === "signed-out") {
        setError(
          "Please sign in to raise a complaint — it is filed against your account so our team can see it and call you back."
        );
        return;
      }

      const customerName =
        (typeof window !== "undefined" &&
          sessionStorage.getItem("customerName")) ||
        "";
      if (!customerName) {
        setError(
          "We couldn't identify your account for this complaint. Please sign in and try again."
        );
        return;
      }

      // This customer's own phone number (never a shared placeholder).
      const phone = session.phone;

      // Refresh before minting a ticket: a cache that had not synced yet
      // reused SA-2026-0001, and the backend upsert then replaced the
      // complaint already holding that number.
      await syncComplaintsFromBackend(true).catch(() => false);
      const complaintId = nextComplaintTicketNo();

      const now = new Date();
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const formattedDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

      const newComplaint = {
        id: complaintId,
        date: formattedDate,
        source: "Raised by customer",
        customerName,
        ownerId:
          (typeof window !== "undefined" && sessionStorage.getItem("customerId")) ||
          undefined,
        email: email.trim() || undefined,
        vehicleRegistrationNo: currentVehicle.registrationNo,
        model: currentVehicle.model,
        category,
        priority,
        // New customer complaints await staff acceptance.
        status: "pending" as const,
        phone,
        description: description.trim(),
        createdAt: new Date().toISOString(),
      };

      // Save to the shared complaints store (visible to staff immediately).
      // Nothing is kept locally unless the backend accepted it: a local-only
      // copy looks saved until the next reload, then disappears — which is
      // exactly the "complaint vanished" report.
      const before = loadComplaints();
      let resolvedTicket = complaintId;
      let persisted = false;

      if (typeof window !== "undefined") {
        try {
          const record = normalizeComplaint({
            ...newComplaint,
            phoneNumber: newComplaint.phone,
            updatedAt: newComplaint.createdAt,
          });
          saveComplaints([
            record,
            ...before.filter((c) => c.id !== complaintId),
          ]);
          // Cross-device: mirror to the backend shared copy. The backend
          // re-keys if our ticket number turns out to be already held, so
          // adopt whatever ticket the complaint actually ends up with.
          const pushed = await pushComplaintToBackend(record);
          persisted = pushed.ok;
          resolvedTicket = pushed.ticket;
        } catch {
          persisted = false;
        }

        if (persisted) {
          try {
            sessionStorage.setItem("lastSubmittedComplaint", resolvedTicket);
          } catch {
            // Storage unavailable — the confirmation just skips the toast.
          }
        } else {
          // Nothing reached staff: roll the local copy back so a retry
          // re-uses this ticket instead of leaving two copies behind.
          saveComplaints(before);
        }
      }

      if (!persisted) {
        setError(
          "We couldn't send your complaint to our team. Please check your internet connection and that you're signed in, then try again."
        );
        return;
      }

      setSuccess("Complaint registered successfully! Our team will review it.");
      setDescription("");

      if (onSuccess) {
        onSuccess(resolvedTicket);
      } else {
        setTimeout(() => {
          router.push("/customer/complaints");
        }, 1500);
      }
    } catch {
      setError("Failed to register complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full min-h-[calc(100vh-4.5rem)] bg-[#F8F9FA] text-slate-800 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${className}`}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ================= PAGE TITLE ================= */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Raise a complaint
          </h1>
        </div>

        {/* ================= FORM CARD ================= */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-7 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field 1: Which vehicle? */}
            <div>
              <label
                htmlFor="vehicleSelect"
                className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
              >
                Which vehicle? <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="vehicleSelect"
                  value={selectedVehicleIndex}
                  onChange={handleVehicleChange}
                  className="w-full bg-[#FBFBFC] border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E8A33D]/40 focus:border-[#E8A33D] transition-colors appearance-none cursor-pointer pr-10"
                >
                  {vehicles.map((v, idx) => (
                    <option key={v.registrationNo + idx} value={idx}>
                      {v.registrationNo} — {v.model}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Field 2 & 3: Vehicle registration no. & Model (Auto-filled / Read-only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label
                  htmlFor="vehicleRegInput"
                  className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Vehicle registration no.
                </label>
                <input
                  id="vehicleRegInput"
                  type="text"
                  value={currentVehicle.registrationNo}
                  readOnly
                  disabled
                  className="w-full bg-[#F4F4F5] border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-600 font-medium cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label
                  htmlFor="vehicleModelInput"
                  className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Model
                </label>
                <input
                  id="vehicleModelInput"
                  type="text"
                  value={currentVehicle.model}
                  readOnly
                  disabled
                  className="w-full bg-[#F4F4F5] border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-600 font-medium cursor-not-allowed select-none capitalize"
                />
              </div>
            </div>

            {/* Field 4 & 5: Complaint category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label
                  htmlFor="categorySelect"
                  className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Complaint category <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="categorySelect"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#FBFBFC] border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E8A33D]/40 focus:border-[#E8A33D] transition-colors appearance-none cursor-pointer pr-10"
                  >
                    {COMPLAINT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="prioritySelect"
                  className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Priority
                </label>
                <div className="relative">
                  <select
                    id="prioritySelect"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#FBFBFC] border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E8A33D]/40 focus:border-[#E8A33D] transition-colors appearance-none cursor-pointer pr-10"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Field 6: Describe the issue */}
            <div>
              <label
                htmlFor="descriptionInput"
                className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
              >
                Describe the issue <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="descriptionInput"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what's wrong..."
                rows={4}
                className="w-full bg-[#FBFBFC] border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8A33D]/40 focus:border-[#E8A33D] transition-colors resize-y min-h-[100px]"
              />
            </div>

            {/* Field: Email for status updates (optional) */}
            <div>
              <label
                htmlFor="emailInput"
                className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
              >
                Email for updates{" "}
                <span className="font-normal text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                id="emailInput"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full bg-[#FBFBFC] border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8A33D]/40 focus:border-[#E8A33D] transition-colors"
              />
            </div>

            {/* Error or Success notification */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                {success}
              </div>
            )}

            {/* Footer row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-gray-500">
                Our service team will review this and update the status.
              </span>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#E8A33D] hover:bg-[#D97706] disabled:opacity-50 text-[#140F06] font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-95 cursor-pointer self-start sm:self-auto"
              >
                {loading ? "Submitting..." : "Submit complaint"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RaiseComplaint;
