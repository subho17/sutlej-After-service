"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadOrders,
  normalizeOrder,
  saveOrders,
} from "@/lib/ordersStore";

export interface SpareItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

export const SPARE_CATEGORIES = [
  "All categories",
  "Battery",
  "Body & Interior",
  "Brakes",
  "Drivetrain",
  "Electrical",
  "Tires & Wheels",
];

export const INITIAL_SPARES: SpareItem[] = [
  { id: "sp-1", name: "12V Deep Cycle Battery", category: "Battery", price: 6500, stock: 15 },
  { id: "sp-2", name: "48V Onboard Battery Charger", category: "Battery", price: 8200, stock: 10 },
  { id: "sp-3", name: "Golf Cart Tire 18×8.5-8", category: "Tires & Wheels", price: 2400, stock: 24 },
  { id: "sp-4", name: "Wheel Bearing Set", category: "Tires & Wheels", price: 950, stock: 30 },
  { id: "sp-5", name: "DC Motor Speed Controller", category: "Electrical", price: 11500, stock: 8 },
  { id: "sp-6", name: "Forward/Reverse Solenoid", category: "Electrical", price: 1800, stock: 20 },
  { id: "sp-7", name: "LED Headlight Kit", category: "Electrical", price: 1600, stock: 18 },
  { id: "sp-8", name: "Main Fuse (Pack of 5)", category: "Electrical", price: 350, stock: 50 },
  { id: "sp-9", name: "Brake Shoe Set (Front/Rear)", category: "Brakes", price: 1650, stock: 22 },
  { id: "sp-10", name: "Heavy Duty Leaf Spring", category: "Drivetrain", price: 4500, stock: 14 },
  { id: "sp-11", name: "Acrylic Split Windshield", category: "Body & Interior", price: 6200, stock: 9 },
  { id: "sp-12", name: "Side View Mirrors Set", category: "Body & Interior", price: 1250, stock: 25 },
];

export interface ShopSparesProps {
  className?: string;
}

/**
 * ShopSpares Global Component
 * Matches the official Sutlej Customer Portal 'Golf cart spares' page.
 * Features:
 * - Search bar & category filter dropdown
 * - Clean spares catalog with Price, Stock and Quantity Steppers
 * - Bottom checkout summary when items are in cart
 */
export function ShopSpares({ className = "" }: ShopSparesProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  const filteredSpares = INITIAL_SPARES.filter((part) => {
    const matchesSearch =
      !searchTerm.trim() ||
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All categories" || part.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleIncrement = (partId: string, maxStock: number) => {
    setQuantities((prev) => {
      const current = prev[partId] || 0;
      if (current >= maxStock) return prev;
      return { ...prev, [partId]: current + 1 };
    });
  };

  const handleDecrement = (partId: string) => {
    setQuantities((prev) => {
      const current = prev[partId] || 0;
      if (current <= 0) return prev;
      const updated = { ...prev, [partId]: current - 1 };
      if (updated[partId] === 0) {
        delete updated[partId];
      }
      return updated;
    });
  };

  // Calculate cart stats
  const totalItemsCount = Object.values(quantities).reduce((acc, q) => acc + q, 0);
  const totalPrice = Object.entries(quantities).reduce((acc, [id, qty]) => {
    const part = INITIAL_SPARES.find((p) => p.id === id);
    return acc + (part ? part.price * qty : 0);
  }, 0);

  const handlePlaceOrder = () => {
    if (totalItemsCount === 0) return;

    setOrderSubmitting(true);
    const count = loadOrders().length + 1;
    const orderId = `ORD-2026-${String(count).padStart(4, "0")}`;

    const items = Object.entries(quantities).map(([id, qty]) => {
      const part = INITIAL_SPARES.find((p) => p.id === id);
      return {
        partId: id,
        partName: part?.name || "Spare Part",
        partNumber: id.toUpperCase(),
        quantity: qty,
        unitPrice: part?.price || 0,
      };
    });

    const now = new Date();
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const formattedDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    const newOrder = {
      id: orderId,
      customerName:
        (typeof window !== "undefined" &&
          sessionStorage.getItem("customerName")) ||
        "Aditi",
      ownerId:
        (typeof window !== "undefined" && sessionStorage.getItem("customerId")) ||
        undefined,
      items,
      totalAmount: totalPrice,
      status: "pending" as const,
      createdAt: formattedDate,
      date: formattedDate,
    };

    if (typeof window !== "undefined") {
      try {
        // Shared store: the order is visible to staff immediately.
        saveOrders([
          normalizeOrder({
            ...newOrder,
            createdAt: new Date().toISOString(),
          }),
          ...loadOrders().filter((o) => o.id !== newOrder.id),
        ]);

        sessionStorage.setItem("lastSubmittedOrder", orderId);
      } catch {
        // Ignore storage errors
      }
    }

    setTimeout(() => {
      setOrderSubmitting(false);
      router.push("/customer/orders");
    }, 600);
  };

  return (
    <div
      className={`w-full min-h-[calc(100vh-4.5rem)] bg-[#F8F9FA] text-slate-800 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${className}`}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ================= PAGE TITLE ================= */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Golf cart spares
          </h1>
        </div>

        {/* ================= CONTROLS: SEARCH & CATEGORY FILTER ================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search parts..."
              className="w-full bg-white border border-gray-200/90 rounded-lg px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8A33D]/30 focus:border-[#E8A33D] transition-colors shadow-xs"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative w-full sm:w-56 shrink-0">
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="w-full bg-white border border-gray-200/90 rounded-lg px-3.5 py-2 text-sm text-gray-800 flex items-center justify-between shadow-xs hover:border-gray-300 focus:outline-none cursor-pointer"
            >
              <span>{selectedCategory}</span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  categoryDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Options */}
            {categoryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setCategoryDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 overflow-hidden animate-in fade-in duration-100">
                  {SPARE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors ${
                        selectedCategory === cat
                          ? "bg-[#64748B] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ================= SPARES TABLE / LIST ================= */}
        <div className="space-y-2">
          {/* Table Header Row */}
          <div className="hidden md:grid grid-cols-12 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div className="col-span-4">PART</div>
            <div className="col-span-3">CATEGORY</div>
            <div className="col-span-2">PRICE (₹)</div>
            <div className="col-span-2">IN STOCK</div>
            <div className="col-span-1 text-center">QUANTITY</div>
          </div>

          {/* Table Rows */}
          {filteredSpares.map((part) => {
            const currentQty = quantities[part.id] || 0;
            return (
              <div
                key={part.id}
                className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-4 flex flex-col md:grid md:grid-cols-12 md:items-center gap-3 md:gap-0 hover:border-gray-300 transition-colors"
              >
                {/* Part Name */}
                <div className="md:col-span-4">
                  <h4 className="text-sm font-bold text-gray-900 leading-snug">
                    {part.name}
                  </h4>
                  <div className="md:hidden flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                      {part.category}
                    </span>
                    <span>·</span>
                    <span className="text-emerald-600 font-medium">
                      {part.stock} in stock
                    </span>
                  </div>
                </div>

                {/* Category */}
                <div className="hidden md:block md:col-span-3 text-xs sm:text-sm text-gray-500 font-medium">
                  {part.category}
                </div>

                {/* Price */}
                <div className="md:col-span-2 text-sm sm:text-base font-bold text-gray-900">
                  ₹{part.price.toLocaleString("en-IN")}
                </div>

                {/* In Stock */}
                <div className="hidden md:block md:col-span-2 text-xs sm:text-sm text-gray-500">
                  {part.stock} in stock
                </div>

                {/* Quantity Stepper */}
                <div className="md:col-span-1 flex items-center justify-end md:justify-center">
                  <div className="inline-flex items-center rounded-lg border border-gray-200 bg-[#FBFBFC] p-0.5">
                    <button
                      type="button"
                      onClick={() => handleDecrement(part.id)}
                      disabled={currentQty === 0}
                      className="w-7 h-7 flex items-center justify-center text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-xs sm:text-sm font-bold text-gray-900">
                      {currentQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleIncrement(part.id, part.stock)}
                      disabled={currentQty >= part.stock}
                      className="w-7 h-7 flex items-center justify-center text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= FLOATING CART CHECKOUT BAR ================= */}
        {totalItemsCount > 0 && (
          <div className="fixed bottom-6 inset-x-4 max-w-2xl mx-auto z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#141820] text-white rounded-2xl p-4 sm:px-6 shadow-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"} selected
                </p>
                <p className="text-base sm:text-lg font-bold text-[#34D399]">
                  Total: ₹{totalPrice.toLocaleString("en-IN")}
                </p>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={orderSubmitting}
                className="bg-[#E8A33D] hover:bg-[#D97706] text-[#140F06] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {orderSubmitting ? "Placing order..." : "Place order →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShopSpares;
