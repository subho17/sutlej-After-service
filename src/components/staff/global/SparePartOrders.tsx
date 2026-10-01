"use client";

import React, { useEffect, useState } from "react";
import { CustomSelect } from "./CustomSelect";
import {
  loadOrders as loadSharedOrders,
  pushOrderStatusToBackend,
  pushOrderToBackend,
  saveOrders as persistSharedOrders,
  subscribeOrders,
  syncOrdersFromBackend,
  type SharedOrder,
} from "@/lib/ordersStore";

export interface OrderItem {
  partId: string;
  partName: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
}

export interface SparePartOrder {
  id: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  vehicleRegistrationNo?: string;
  vehicleModel?: string;
  deliveryAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "dispatched" | "delivered" | "cancelled";
  createdAt: string;
  notes?: string;
}

export function SparePartOrders() {
  // Shared store: status updates here are visible in the customer portal too.
  const [orders, setOrders] = useState<SharedOrder[]>(loadSharedOrders);
  // Shared store: customer orders arrive live, no refresh needed.
  useEffect(() => {
    const rebuild = () => setOrders(loadSharedOrders());
    // Cross-device: pull orders placed on other devices, then rebuild.
    syncOrdersFromBackend().then((changed) => {
      if (changed) rebuild();
    });
    return subscribeOrders(rebuild);
  }, []);

  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<SharedOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New order form state
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPartName, setNewPartName] = useState("");
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState(1500);

  const saveOrders = (updated: SharedOrder[]) => {
    setOrders(updated);
    // Shared store: staff edits (e.g. Delivered) appear in the customer portal.
    persistSharedOrders(updated);
  };

  const handleUpdateStatus = (
    orderId: string,
    newStatus: SharedOrder["status"]
  ) => {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    saveOrders(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    // Cross-device: sync the status move to the backend (fire-and-forget).
    pushOrderStatusToBackend(orderId, newStatus);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newPhone.trim() || !newPartName.trim()) {
      return;
    }

    const newOrder: SharedOrder = {
      id: `ORD-${Date.now().toString().slice(-5)}`,
      customerName: newCustomerName.trim(),
      phoneNumber: newPhone.trim(),
      items: [
        {
          partId: `P-${Date.now()}`,
          partName: newPartName.trim(),
          partNumber: `SUT-${Math.floor(1000 + Math.random() * 9000)}`,
          quantity: Number(newPartQty) || 1,
          unitPrice: Number(newPartPrice) || 0,
        },
      ],
      totalAmount: (Number(newPartQty) || 1) * (Number(newPartPrice) || 0),
      status: "pending",
      createdAt: new Date().toISOString(),
      date: new Date().toISOString(),
    };

    saveOrders([newOrder, ...orders]);
    // Cross-device: mirror to the backend shared copy (fire-and-forget).
    pushOrderToBackend(newOrder, "staff");
    setShowCreateModal(false);
    setNewCustomerName("");
    setNewPhone("");
    setNewPartName("");
    setNewPartQty(1);
    setNewPartPrice(1500);
  };

  // Filtered orders based on selected dropdown status
  const filteredOrders = orders.filter((item) => {
    if (statusFilter === "all") return true;
    return item.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const getStatusBadge = (status: SharedOrder["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Pending
          </span>
        );
      case "processing":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            Processing
          </span>
        );
      case "dispatched":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            Dispatched
          </span>
        );
      case "delivered":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Delivered
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#F3EEF5] text-slate-800 p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Spare part orders{" "}
              <span className="font-normal text-slate-500 text-base sm:text-lg">
                ({filteredOrders.length} of {orders.length})
              </span>
            </h1>

            {/* Modern Status Filter Dropdown */}
            <div className="mt-3">
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "pending", label: "Pending", dotColor: "amber" },
                  { value: "processing", label: "Processing", dotColor: "sky" },
                  { value: "dispatched", label: "Dispatched", dotColor: "purple" },
                  { value: "delivered", label: "Delivered", dotColor: "emerald" },
                  { value: "cancelled", label: "Cancelled", dotColor: "rose" },
                ]}
                size="sm"
                className="w-40"
              />
            </div>
          </div>

          {/* Optional Action / Test order creation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 shadow-sm transition-colors cursor-pointer"
            >
              + Create Order
            </button>
            {orders.length > 0 && (
              <button
                onClick={() => saveOrders([])}
                className="text-xs font-medium text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-md px-3 py-1.5 shadow-sm transition-colors cursor-pointer"
                title="Reset to empty state"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {filteredOrders.length === 0 ? (
          /* Empty State exactly matching the screenshot */
          <div className="flex-1 flex flex-col items-center justify-center py-28 sm:py-36 text-center select-none">
            {/* Hexagonal Exclamation Icon */}
            <div className="w-12 h-12 text-slate-400 mb-3 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-9 h-9"
              >
                <path d="M12 2l8 4.6v9.2L12 20.4l-8-4.6V6.6L12 2z" />
                <line x1="12" y1="8" x2="12" y2="12.5" strokeWidth="1.6" />
                <circle cx="12" cy="15.5" r="0.75" fill="currentColor" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              No orders yet
            </h3>

            {/* Subtitle */}
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
              Spare part orders placed by customers will appear here.
            </p>
          </div>
        ) : (
          /* Orders Table (desktop) / Cards (mobile) */
          <>
            <div className="hidden md:block bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden mt-2">
              <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-gray-200/80 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Parts Ordered</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 text-xs">
                        {order.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {order.phoneNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="truncate max-w-xs">
                            {item.partName} × {item.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 text-sm">
                        ₹{order.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mr-3 cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-3 mt-2">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-xs text-slate-900">
                      {order.id}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {order.customerName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {order.phoneNumber}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="truncate">
                        {item.partName} × {item.quantity}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      ₹{order.totalAmount.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-full py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Order Details ({selectedOrder.id})
                </h3>
                <p className="text-xs text-slate-500">
                  Placed on{" "}
                  {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 text-xs block">Customer</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOrder.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Phone</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOrder.phoneNumber}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Ordered Items
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {selectedOrder.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">
                          {it.partName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Part #: {it.partNumber}
                        </div>
                      </div>
                      <div className="text-right">
                        <div>
                          {it.quantity} × ₹{it.unitPrice.toLocaleString("en-IN")}
                        </div>
                        <div className="font-semibold text-slate-900">
                          ₹
                          {(it.quantity * it.unitPrice).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-800">Total Amount</span>
                  <span className="font-bold text-slate-900 text-base">
                    ₹{selectedOrder.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Status Update */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Update Order Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "pending",
                      "processing",
                      "dispatched",
                      "delivered",
                      "cancelled",
                    ] as const
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        selectedOrder.status === st
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateOrder}
            className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-150 my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                Create Spare Part Order
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Jaspreet Singh"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Part Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="e.g. Sutlej Heavy Duty Brake Pads"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newPartPrice}
                    onChange={(e) => setNewPartPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#E8A33D] hover:bg-[#d9942f] text-slate-900 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Create Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SparePartOrders;
