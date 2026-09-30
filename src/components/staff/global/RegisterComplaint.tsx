"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomSelect } from "./CustomSelect";
import {
  loadComplaints,
  normalizeComplaint,
  saveComplaints,
} from "@/lib/complaintsStore";

export interface RegisterComplaintFormData {
  registeredCustomer: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  vehicleRegistrationNo: string;
  model: string;
  category: string;
  priority: string;
  details: string;
}

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

export function RegisterComplaint() {
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterComplaintFormData>({
    registeredCustomer: "Walk-in / not registered",
    customerName: "",
    phoneNumber: "",
    email: "",
    vehicleRegistrationNo: "",
    model: "",
    category: "Engine / Motor issue",
    priority: "Medium",
    details: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!formData.vehicleRegistrationNo.trim()) {
      setError("Vehicle registration number is required.");
      return;
    }
    if (!formData.details.trim()) {
      setError("Please describe the complaint details.");
      return;
    }

    setLoading(true);

    try {
      // Create new complaint record
      const newComplaint = {
        id: `CMP-${Date.now().toString().slice(-4)}`,
        title: `${formData.category} - ${formData.vehicleRegistrationNo.trim().toUpperCase()}`,
        description: formData.details.trim(),
        customerName: formData.customerName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim() || undefined,
        vehicleRegistrationNo: formData.vehicleRegistrationNo.trim().toUpperCase(),
        model: formData.model.trim() || "Club Car",
        category: formData.category,
        priority: formData.priority,
        status: "open" as const,
        createdAt: new Date().toISOString(),
      };

      // Store in the shared complaints store (visible in customer portal too)
      saveComplaints([
        normalizeComplaint({
          ...newComplaint,
          createdAt: new Date().toISOString(),
          date: new Date().toISOString(),
        }),
        ...loadComplaints().filter((c) => c.id !== newComplaint.id),
      ]);

      setSuccess("Complaint registered successfully! Redirecting...");

      setTimeout(() => {
        router.push("/staff/dashboard");
      }, 1200);
    } catch {
      setError("Failed to register complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#F3EEF5] text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
          Register a complaint
        </h1>

        {/* Card */}
        <div className="bg-white rounded-lg border border-gray-200/90 shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-4 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md p-3">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Registered customer (optional) */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                Registered customer (optional)
              </label>
              <CustomSelect
                name="registeredCustomer"
                value={formData.registeredCustomer}
                onChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    registeredCustomer: val,
                    ...(val === "Green Valley Golf Resort"
                      ? {
                          customerName: "Harpreet Kaur",
                          phoneNumber: "+91 98765 12345",
                          vehicleRegistrationNo: "PB 08 CX 5678",
                          model: "Club Car Tempo 4-Seater",
                        }
                      : val === "Royal Palm Country Club"
                      ? {
                          customerName: "Ranjit Singh",
                          phoneNumber: "+91 98140 98765",
                          vehicleRegistrationNo: "PB 10 BT 9012",
                          model: "Yamaha Drive2 PTV",
                        }
                      : val === "Pinecrest Club & Resort"
                      ? {
                          customerName: "Amit Sharma",
                          phoneNumber: "+91 99887 65432",
                          vehicleRegistrationNo: "CH 01 AB 3456",
                          model: "EZ-GO RXV Elite Lithium",
                        }
                      : {}),
                  }));
                }}
                options={[
                  { value: "Walk-in / not registered", label: "Walk-in / not registered" },
                  {
                    value: "Green Valley Golf Resort",
                    label: "Green Valley Golf Resort (Harpreet Kaur)",
                  },
                  {
                    value: "Royal Palm Country Club",
                    label: "Royal Palm Country Club (Ranjit Singh)",
                  },
                  {
                    value: "Pinecrest Club & Resort",
                    label: "Pinecrest Club & Resort (Amit Sharma)",
                  },
                ]}
                className="w-full"
              />
            </div>

            {/* Row: Customer name & Phone number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Customer name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="e.g. Ranjit Singh"
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Phone number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g. 98140 00000"
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                  required
                />
              </div>
            </div>

            {/* Customer email (optional, for status-update emails) */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                Customer email{" "}
                <span className="font-normal text-slate-400 text-xs">(optional, for email updates)</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. customer@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
              />
            </div>

            {/* Row: Vehicle registration no. & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Vehicle registration no. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vehicleRegistrationNo"
                  value={formData.vehicleRegistrationNo}
                  onChange={handleChange}
                  placeholder="e.g. PB-10-GC-0451"
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g. Club Car Tempo"
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                />
              </div>
            </div>

            {/* Row: Complaint category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Complaint category <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  name="category"
                  value={formData.category}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, category: val }))
                  }
                  options={COMPLAINT_CATEGORIES.map((cat) => ({
                    value: cat,
                    label: cat,
                  }))}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Priority
                </label>
                <CustomSelect
                  name="priority"
                  value={formData.priority}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, priority: val }))
                  }
                  options={[
                    { value: "Low", label: "Low", dotColor: "emerald" },
                    { value: "Medium", label: "Medium", dotColor: "amber" },
                    { value: "High", label: "High", dotColor: "amber" },
                    { value: "Urgent", label: "Urgent", dotColor: "rose" },
                  ]}
                  className="w-full"
                />
              </div>
            </div>

            {/* Complaint details * */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                Complaint details <span className="text-red-500">*</span>
              </label>
              <textarea
                name="details"
                rows={4}
                value={formData.details}
                onChange={handleChange}
                placeholder="Describe the issue reported by the customer..."
                className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all resize-y"
                required
              />
            </div>

            {/* Bottom Row: Notice and Action Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-400 font-normal">
                Fields marked <span className="text-red-500">*</span> are required
              </span>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-[#E5A038] hover:bg-[#D98E28] active:bg-[#C97E1C] disabled:opacity-60 text-white font-semibold text-sm transition-colors duration-200 shadow-sm cursor-pointer"
              >
                {loading ? "Registering..." : "Register complaint"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterComplaint;
