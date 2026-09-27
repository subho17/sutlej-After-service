"use client";

import React, { useState } from "react";

export interface Vehicle {
  id: string;
  registrationNo: string;
  model: string;
  purchaseDate: string;
  nextServiceDate: string;
}

const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: "veh-1",
    registrationNo: "PB-10-GC-PT",
    model: "club car tempo",
    purchaseDate: "27 Sept 2026",
    nextServiceDate: "27 Dec 2026",
  },
];

export interface MyVehiclesProps {
  initialVehicles?: Vehicle[];
  className?: string;
}

/**
 * MyVehicles Global Component
 * Matches the official Sutlej Customer Portal 'My vehicles' page.
 * Features:
 * - Counter header: "My vehicles (N)"
 * - Vehicle cards with Royal Plum left accent border, model & registration details, and green next service date
 * - Add vehicle form (Registration no, Model, Purchase / registration date)
 * - Dynamic addition of new vehicles with automatic 3-month next quarterly service calculation
 */
function getInitialVehicles(fallback: Vehicle[]): Vehicle[] {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem("sutlej_customer_vehicles");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return fallback;
}

export function MyVehicles({
  initialVehicles,
  className = "",
}: MyVehiclesProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const fallback =
      initialVehicles && initialVehicles.length > 0
        ? initialVehicles
        : DEFAULT_VEHICLES;
    return getInitialVehicles(fallback);
  });

  const [registrationNo, setRegistrationNo] = useState("");
  const [model, setModel] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveVehicles = (updated: Vehicle[]) => {
    setVehicles(updated);
    try {
      localStorage.setItem("sutlej_customer_vehicles", JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const reg = registrationNo.trim().toUpperCase();
    const mdl = model.trim();

    if (!reg) {
      setErrorMessage("Please enter a registration number.");
      return;
    }
    if (!mdl) {
      setErrorMessage("Please enter a vehicle model.");
      return;
    }

    // Format dates
    let formattedRegDate = "Registered today";
    let formattedNextDate = "In 3 months";

    if (purchaseDate) {
      const pDate = new Date(purchaseDate);
      if (!isNaN(pDate.getTime())) {
        const months = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
        ];
        formattedRegDate = `Registered ${pDate.getDate()} ${months[pDate.getMonth()]} ${pDate.getFullYear()}`;

        // Next quarterly service (+3 months)
        const nDate = new Date(pDate);
        nDate.setMonth(nDate.getMonth() + 3);
        formattedNextDate = `${nDate.getDate()} ${months[nDate.getMonth()]} ${nDate.getFullYear()}`;
      }
    } else {
      const now = new Date();
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
      ];
      formattedRegDate = `Registered ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
      const nextQuarter = new Date(now);
      nextQuarter.setMonth(nextQuarter.getMonth() + 3);
      formattedNextDate = `${nextQuarter.getDate()} ${months[nextQuarter.getMonth()]} ${nextQuarter.getFullYear()}`;
    }

    const newVehicle: Vehicle = {
      id: `veh-${Date.now()}`,
      registrationNo: reg,
      model: mdl,
      purchaseDate: formattedRegDate,
      nextServiceDate: formattedNextDate,
    };

    const updated = [...vehicles, newVehicle];
    saveVehicles(updated);

    setRegistrationNo("");
    setModel("");
    setPurchaseDate("");
    setSuccessMessage(`Vehicle ${reg} added successfully!`);

    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <div
      className={`w-full min-h-[calc(100vh-4.5rem)] bg-[#F8F9FA] text-slate-800 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${className}`}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ================= SECTION TITLE ================= */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            <span>My vehicles</span>
            <span className="text-gray-500 font-normal ml-2">
              ({vehicles.length})
            </span>
          </h1>
        </div>

        {/* ================= VEHICLE CARDS LIST ================= */}
        <div className="space-y-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="relative bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 gap-3"
            >
              {/* Royal Plum Left Accent Bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 sm:w-2 bg-[#5B2C6F]"
                aria-hidden="true"
              />

              {/* Left Column: Registration & Model Info */}
              <div className="pl-2 sm:pl-3">
                <h3
                  className="text-base sm:text-lg font-bold text-gray-900 tracking-wider uppercase"
                  style={{
                    fontFamily:
                      "'Rajdhani', 'Orbitron', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    letterSpacing: "0.06em",
                  }}
                >
                  {v.registrationNo}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  <span className="capitalize">{v.model}</span>
                  {v.purchaseDate && (
                    <>
                      <span className="mx-1.5 text-gray-400">·</span>
                      <span>
                        {v.purchaseDate.startsWith("Registered")
                          ? v.purchaseDate
                          : `Registered ${v.purchaseDate}`}
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* Right Column: Next Service Schedule */}
              <div className="pl-2 sm:pl-0 sm:text-right shrink-0">
                <span className="text-xs sm:text-sm font-semibold text-[#15803D]">
                  Next: {v.nextServiceDate}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ================= ADD VEHICLE CARD ================= */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-7 max-w-2xl mt-8">
          <form onSubmit={handleAddVehicle} className="space-y-5">
            {/* Row 1: Registration no. & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label
                  htmlFor="regNoInput"
                  className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Registration no.
                </label>
                <input
                  id="regNoInput"
                  type="text"
                  value={registrationNo}
                  onChange={(e) => setRegistrationNo(e.target.value)}
                  placeholder="e.g. PB-10-GC-0899"
                  className="w-full bg-[#FBFBFC] border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8A33D]/40 focus:border-[#E8A33D] transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="modelInput"
                  className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Model
                </label>
                <input
                  id="modelInput"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. E-Z-GO Freedom"
                  className="w-full bg-[#FBFBFC] border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8A33D]/40 focus:border-[#E8A33D] transition-colors"
                />
              </div>
            </div>

            {/* Row 2: Purchase / registration date */}
            <div className="max-w-xs">
              <label
                htmlFor="purchaseDateInput"
                className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
              >
                Purchase / registration date
              </label>
              <input
                id="purchaseDateInput"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-[#FBFBFC] border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8A33D]/40 focus:border-[#E8A33D] transition-colors cursor-pointer"
              />
            </div>

            {/* Feedback Messages */}
            {errorMessage && (
              <p className="text-xs text-rose-600 font-medium">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="text-xs text-emerald-600 font-medium">
                {successMessage}
              </p>
            )}

            {/* Row 3: Subtext & Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-gray-500">
                Add another vehicle to your account
              </span>
              <button
                type="submit"
                className="bg-[#E8A33D] hover:bg-[#D97706] text-[#140F06] font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-95 cursor-pointer self-start sm:self-auto"
              >
                Add vehicle
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MyVehicles;
