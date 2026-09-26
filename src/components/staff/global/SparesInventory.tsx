"use client";

import React, { useState } from "react";

export interface SparePart {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

const DEFAULT_SPARES: SparePart[] = [
  { id: "SP-001", name: "12V Deep Cycle Battery", category: "Battery", price: 6500, stock: 15 },
  { id: "SP-002", name: "48V Onboard Battery Charger", category: "Battery", price: 8200, stock: 10 },
  { id: "SP-003", name: "Golf Cart Tire 18×8.5-8", category: "Tires & Wheels", price: 2400, stock: 24 },
  { id: "SP-004", name: "Wheel Bearing Set", category: "Tires & Wheels", price: 950, stock: 30 },
  { id: "SP-005", name: "DC Motor Speed Controller", category: "Electrical", price: 11500, stock: 8 },
  { id: "SP-006", name: "Forward/Reverse Solenoid", category: "Electrical", price: 1800, stock: 20 },
  { id: "SP-007", name: "Rear Shock Absorber", category: "Suspension", price: 3200, stock: 12 },
  { id: "SP-008", name: "Heavy Duty Leaf Spring", category: "Suspension", price: 4500, stock: 14 },
  { id: "SP-009", name: "Brake Shoe Set (Front/Rear)", category: "Brakes", price: 1650, stock: 22 },
  { id: "SP-010", name: "LED Headlight & Taillight Kit", category: "Electrical", price: 5400, stock: 18 },
  { id: "SP-011", name: "Key Switch with 2 Keys", category: "Electrical", price: 750, stock: 35 },
  { id: "SP-012", name: "Drive Belt (Heavy Duty)", category: "Powertrain", price: 1950, stock: 16 },
  { id: "SP-013", name: "Steering Rack & Pinion Assembly", category: "Steering", price: 7800, stock: 6 },
  { id: "SP-014", name: "Acrylic Split Windshield", category: "Body & Accessories", price: 6200, stock: 9 },
  { id: "SP-015", name: "Side View Mirrors Set", category: "Body & Accessories", price: 1250, stock: 25 },
];

function loadParts(): SparePart[] {
  if (typeof window === "undefined") return DEFAULT_SPARES;
  try {
    const stored = localStorage.getItem("staffSparesInventory");
    if (stored) return JSON.parse(stored) as SparePart[];
    localStorage.setItem("staffSparesInventory", JSON.stringify(DEFAULT_SPARES));
    return DEFAULT_SPARES;
  } catch {
    // Fallback to default
    return DEFAULT_SPARES;
  }
}

export function SparesInventory() {
  const [parts, setParts] = useState<SparePart[]>(loadParts);
  const [savedId, setSavedId] = useState<string | null>(null);

  // New Part Form State
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const saveToStorage = (updated: SparePart[]) => {
    setParts(updated);
    try {
      localStorage.setItem("staffSparesInventory", JSON.stringify(updated));
    } catch {
      // storage error
    }
  };

  // Add Part Handler
  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newName.trim()) {
      setAddError("Please enter a part name.");
      return;
    }
    if (!newCategory.trim()) {
      setAddError("Please enter a category.");
      return;
    }
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setAddError("Please enter a valid price.");
      return;
    }
    const stockNum = parseInt(newStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setAddError("Please enter a valid stock quantity.");
      return;
    }

    const nextIndex = parts.length + 1;
    const nextId = `SP-${nextIndex.toString().padStart(3, "0")}`;

    const newPart: SparePart = {
      id: nextId,
      name: newName.trim(),
      category: newCategory.trim(),
      price: priceNum,
      stock: stockNum,
    };

    const updated = [newPart, ...parts];
    saveToStorage(updated);

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
  const handleSaveRow = (id: string) => {
    saveToStorage(parts);
    setSavedId(id);
    setTimeout(() => {
      setSavedId(null);
    }, 1500);
  };

  // Delete Row
  const handleDeleteRow = (id: string) => {
    if (confirm("Are you sure you want to delete this part from the inventory?")) {
      const updated = parts.filter((item) => item.id !== id);
      saveToStorage(updated);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#F3EEF5] text-slate-800 p-4 sm:p-6 lg:p-8">
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
