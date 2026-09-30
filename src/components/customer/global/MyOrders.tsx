"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EmptyStateCard } from "./EmptyStateCard";
import { loadOrders } from "@/lib/ordersStore";

export interface OrderItem {
  partId?: string;
  partName: string;
  quantity: number;
  unitPrice: number;
}

export interface CustomerOrder {
  id: string;
  date: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "dispatched" | "delivered" | "cancelled";
}

function getInitialOrders(fallback: CustomerOrder[]): CustomerOrder[] {
  // Shared store: staff status updates (Delivered, …) show up here too.
  const shared = loadOrders();
  if (shared.length > 0) return shared as unknown as CustomerOrder[];
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem("sutlej_customer_orders");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return fallback;
}

export interface MyOrdersProps {
  initialOrders?: CustomerOrder[];
  className?: string;
}

/**
 * MyOrders Global Component
 * Matches the official Sutlej Customer Portal 'My orders' page.
 * Features:
 * - Counter header: "My orders (N)"
 * - Empty state with hexagon exclamation: "No orders yet"
 * - Order cards with items breakdown, status pill, total amount, and receipt download
 */
export function MyOrders({ initialOrders, className = "" }: MyOrdersProps) {
  const [orders] = useState<CustomerOrder[]>(() => {
    const fallback = initialOrders || [];
    return getInitialOrders(fallback);
  });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadReceipt = (order: CustomerOrder) => {
    setDownloadingId(order.id);

    // Generate printable receipt window or trigger browser print
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${order.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: 800; color: #0f172a; }
            .sub { color: #64748b; font-size: 13px; margin-top: 4px; }
            .meta { margin-bottom: 24px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1; font-size: 12px; color: #64748b; text-transform: uppercase; }
            td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .total { font-size: 18px; font-weight: 700; text-align: right; margin-top: 24px; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">SUTLEJ AUTOMOTIVES</div>
            <div class="sub">Official Parts &amp; Service Receipt</div>
          </div>
          <div class="meta">
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Date:</strong> ${order.date}</p>
            <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.partName}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.unitPrice.toLocaleString("en-IN")}</td>
                  <td style="text-align: right;">₹${(item.unitPrice * item.quantity).toLocaleString("en-IN")}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="total">
            Total Paid: ₹${order.totalAmount.toLocaleString("en-IN")}
          </div>
        </body>
      </html>
    `;

    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(receiptHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
        setDownloadingId(null);
      }, 500);
    } else {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200/50">
            Delivered
          </span>
        );
      case "processing":
      case "dispatched":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 border border-sky-200/50 capitalize">
            {status}
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200/50">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200/50">
            Pending
          </span>
        );
    }
  };

  return (
    <div
      className={`w-full min-h-[calc(100vh-4.5rem)] bg-[#F8F9FA] text-slate-800 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${className}`}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ================= SECTION TITLE ================= */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            <span>My orders</span>
            <span className="text-gray-500 font-normal ml-2">
              ({orders.length})
            </span>
          </h1>
        </div>

        {/* ================= ORDERS CONTENT ================= */}
        {orders.length === 0 ? (
          <div className="pt-4">
            <EmptyStateCard
              title="No orders yet"
              description="Spare parts you order from the shop will appear here, with a downloadable receipt."
            />
            <div className="text-center mt-6">
              <Link
                href="/customer/spares"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#DF8C1B] hover:text-[#B46B0E] hover:underline"
              >
                <span>Browse golf cart spares</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="relative bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden p-5 sm:p-6"
              >
                {/* Top Row: Order ID, Date & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-gray-900 tracking-wider">
                      {order.id}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      Placed on {order.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(order)}
                      disabled={downloadingId === order.id}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <svg
                        className="w-3.5 h-3.5 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      <span>
                        {downloadingId === order.id
                          ? "Generating..."
                          : "Receipt"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="py-4 space-y-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs sm:text-sm text-gray-700"
                    >
                      <span>
                        <span className="font-semibold text-gray-900">
                          {item.quantity}×
                        </span>{" "}
                        {item.partName}
                      </span>
                      <span className="font-medium text-gray-900">
                        ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Row: Total Amount */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </span>
                  <span className="text-base sm:text-lg font-bold text-gray-900">
                    ₹{order.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
