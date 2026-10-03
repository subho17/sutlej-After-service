"use client";

import React, { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

export interface SparePart {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface SparePartRow {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

function fromRow(row: SparePartRow): SparePart {
  return { id: row.sku, name: row.name, category: row.category, price: Number(row.price), stock: Number(row.stock) };
}

import { useStaffAlert } from "../alerts";

export function SparesInventory() {
  const { showSuccess, showError, showWarning, showConfirm } = useStaffAlert();
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<SparePartRow[]>("/api/spare-parts")
      .then(({ ok, body }) => {
        if (cancelled || !ok || !body?.data) return;
        setParts(body.data.map(fromRow));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // New Part Form State
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  // Add Part Handler
  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newName.trim()) {
      const err = "Please enter a part name.";
      setAddError(err);
      showWarning("Validation Required", err);
      return;
    }
    if (!newCategory.trim()) {
      const err = "Please enter a category.";
      setAddError(err);
      showWarning("Validation Required", err);
      return;
    }
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      const err = "Please enter a valid price.";
      setAddError(err);
      showWarning("Validation Required", err);
      return;
    }
    const stockNum = parseInt(newStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      const err = "Please enter a valid stock quantity.";
      setAddError(err);
      showWarning("Validation Required", err);
      return;
    }

    const nextIndex = parts.length + 1;
    const nextId = `SP-${nextIndex.toString().padStart(3, "0")}`;

    const { ok, body } = await apiPost<SparePartRow>("/api/spare-parts", {
      sku: nextId,
      name: newName.trim(),
      category: newCategory.trim(),
      price: priceNum,
      stock: stockNum,
    });
    if (ok && body?.data) {
      setParts((prev) => [fromRow(body.data as SparePartRow), ...prev]);
      showSuccess("Spare Part Added", `SKU ${nextId} (${newName.trim()}) registered with ${stockNum} units.`);
    } else {
      const err = "Could not save to the server. Please try again.";
      setAddError(err);
      showError("Registration Failed", err);
      return;
    }

    // Reset Form
    setNewName("");
    setNewCategory("");
    setNewPrice("");
    setNewStock("");
  };

  // Update Field in Row
  const handleFieldChange = (
    id: string,
    field: keyof SparePart,
    val: string | number
  ) => {
    setParts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  // Save Row
  const handleSaveRow = async (id: string) => {
    const row = parts.find((p) => p.id === id);
    if (!row) return;
    const { ok, body } = await apiPatch<SparePartRow>(`/api/spare-parts/${encodeURIComponent(id)}`, {
      name: row.name,
      category: row.category,
      price: row.price,
      stock: row.stock,
    });
    if (ok && body?.data) {
      setParts((prev) => prev.map((p) => (p.id === id ? fromRow(body.data as SparePartRow) : p)));
      setSavedId(id);
      showSuccess("Inventory Updated", `Saved changes to ${row.name}.`);
      setTimeout(() => setSavedId(null), 1500);
    } else {
      showError("Update Failed", `Could not update ${row.name}.`);
    }
  };

  // Delete Row
  const handleDeleteRow = (id: string) => {
    const part = parts.find((p) => p.id === id);
    showConfirm({
      title: "Delete Spare Part?",
      message: `Are you sure you want to remove "${part?.name || id}" from the inventory? This action cannot be undone.`,
      confirmText: "Delete Part",
      cancelText: "Keep Part",
      type: "danger",
      onConfirm: async () => {
        setParts((prev) => prev.filter((item) => item.id !== id));
        await apiDelete(`/api/spare-parts/${encodeURIComponent(id)}`).catch(() => {});
        showSuccess("Part Deleted", `Removed "${part?.name || id}" from inventory.`);
      },
    });
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#F4F6FB] text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Spares Inventory{" "}
            <span className="text-base font-normal text-slate-500">
              ({parts.length} parts)
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Add new parts, edit names/categories/prices/stock — changes apply immediately in the customer shop.
          </p>
        </div>

        {/* Top "Add Part" Card */}
        <div className="bg-white rounded-lg border border-gray-200/90 shadow-sm p-6 max-w-xl">
          {addError && (
            <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2.5">
              {addError}
            </div>
          )}

          <form onSubmit={handleAddPart} className="space-y-4">
            {/* Row 1: Part name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Part name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rear Shock Absorber"
                  className="w-full px-3.5 py-2 rounded-md border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Suspension"
                  className="w-full px-3.5 py-2 rounded-md border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                  required
                />
              </div>
            </div>

            {/* Row 2: Price & Stock quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="e.g. 3200"
                  className="w-full px-3.5 py-2 rounded-md border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Stock quantity
                </label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3.5 py-2 rounded-md border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                  required
                />
              </div>
            </div>

            {/* Row 3: Action Row */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-normal">
                Add a new part to the catalog
              </span>
              <button
                type="submit"
                className="px-5 py-2 rounded-md bg-[#E5A038] hover:bg-[#D98E28] active:bg-[#C97E1C] text-white font-semibold text-sm transition-colors duration-200 shadow-sm cursor-pointer"
              >
                Add part
              </button>
            </div>
          </form>
        </div>

        {/* Inventory Column Headers */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-5">PART</div>
          <div className="col-span-3">CATEGORY</div>
          <div className="col-span-1 text-center">PRICE (₹)</div>
          <div className="col-span-1 text-center">IN STOCK</div>
          <div className="col-span-2 text-right pr-2">ACTIONS</div>
        </div>

        {/* Spares Inventory Rows */}
        <div className="space-y-3">
          {loading && (
            <p className="text-sm text-slate-500">Loading inventory…</p>
          )}
          {parts.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200/90 shadow-sm p-4 flex flex-col md:grid md:grid-cols-12 gap-3 items-stretch md:items-center transition-all hover:border-slate-300"
            >
              {/* Part Name & SKU */}
              <div className="col-span-5">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleFieldChange(item.id, "name", e.target.value)}
                  className="w-full font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#6366F1] focus:bg-[#FCFCFD] px-1 py-1 rounded transition-colors focus:outline-none"
                />
                <div className="text-xs font-mono text-slate-400 px-1 mt-0.5">
                  {item.id}
                </div>
              </div>

              {/* Category */}
              <div className="col-span-3">
                <input
                  type="text"
                  value={item.category}
                  onChange={(e) => handleFieldChange(item.id, "category", e.target.value)}
                  className="w-full text-xs font-medium text-slate-700 bg-transparent border border-slate-200/70 hover:border-slate-300 focus:border-[#6366F1] focus:bg-[#FCFCFD] px-2.5 py-1.5 rounded transition-colors focus:outline-none"
                />
              </div>

              {/* Price */}
              <div className="col-span-1">
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    handleFieldChange(item.id, "price", parseFloat(e.target.value) || 0)
                  }
                  className="w-full text-center text-xs font-semibold text-slate-800 bg-transparent border border-slate-200/70 hover:border-slate-300 focus:border-[#6366F1] focus:bg-[#FCFCFD] px-1.5 py-1.5 rounded transition-colors focus:outline-none"
                />
              </div>

              {/* In Stock */}
              <div className="col-span-1">
                <input
                  type="number"
                  value={item.stock}
                  onChange={(e) =>
                    handleFieldChange(item.id, "stock", parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full text-center text-xs font-semibold text-slate-800 bg-transparent border border-slate-200/70 hover:border-slate-300 focus:border-[#6366F1] focus:bg-[#FCFCFD] px-1.5 py-1.5 rounded transition-colors focus:outline-none"
                />
              </div>

              {/* Actions: Save & Delete */}
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveRow(item.id)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                    savedId === item.id
                      ? "bg-emerald-600 text-white"
                      : "bg-[#382B4F] hover:bg-[#4E3F6E] active:bg-[#2A1F3D] text-white shadow-sm"
                  }`}
                >
                  {savedId === item.id ? "Saved!" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRow(item.id)}
                  className="px-3 py-1.5 rounded border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SparesInventory;
