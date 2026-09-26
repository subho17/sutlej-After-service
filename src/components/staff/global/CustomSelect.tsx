"use client";

import React, { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string;
  label: string;
  dotColor?: string; // e.g. "amber", "emerald", "sky", "purple", "rose", or hex "#10B981"
  badge?: string;
  description?: string;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
}

// Pre-defined static color classes to guarantee Tailwind v4 compiles them
const COLOR_MAP: Record<string, string> = {
  amber: "bg-amber-500 ring-amber-500/20",
  yellow: "bg-amber-500 ring-amber-500/20",
  sky: "bg-sky-500 ring-sky-500/20",
  blue: "bg-blue-500 ring-blue-500/20",
  purple: "bg-purple-500 ring-purple-500/20",
  emerald: "bg-emerald-500 ring-emerald-500/20",
  green: "bg-emerald-500 ring-emerald-500/20",
  rose: "bg-rose-500 ring-rose-500/20",
  red: "bg-rose-500 ring-rose-500/20",
  slate: "bg-slate-400 ring-slate-400/20",
  gray: "bg-gray-400 ring-gray-400/20",
};

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  name,
  required = false,
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  size = "md",
  align = "left",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options to SelectOption objects
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-md",
    md: "px-3.5 py-2 text-xs sm:text-sm rounded-lg",
    lg: "px-4 py-2.5 text-sm rounded-lg",
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  // Helper to render dot indicator
  const renderDot = (dotColor?: string) => {
    if (!dotColor) return null;
    const cleanKey = dotColor.replace("bg-", "").replace("-500", "").toLowerCase();
    const mappedClass = COLOR_MAP[cleanKey];

    if (mappedClass) {
      return (
        <span
          className={`w-2 h-2 rounded-full ring-2 shrink-0 ${mappedClass}`}
        />
      );
    }

    return (
      <span
        className="w-2 h-2 rounded-full ring-2 ring-black/10 shrink-0"
        style={{ backgroundColor: dotColor }}
      />
    );
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative text-left select-none ${className}`}
    >
      {/* Hidden native input for standard form POST compatibility */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      {/* Modern Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full group flex items-center justify-between gap-2.5 bg-white border border-slate-200/90 text-slate-800 shadow-xs hover:border-slate-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E8A33D]/25 focus:border-[#E8A33D] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${
          isOpen ? "border-[#E8A33D] ring-2 ring-[#E8A33D]/25" : ""
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {renderDot(selectedOption?.dotColor)}
          <span className="truncate font-medium text-slate-800">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Crisp Chevron with Smooth Rotation */}
        <div
          className={`shrink-0 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#E8A33D]" : ""
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 8l4 4 4-4"
            />
          </svg>
        </div>
      </button>

      {/* Floating Animated Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1.5 w-full min-w-[180px] bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 backdrop-blur-md overflow-hidden max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ${
            align === "right" ? "right-0" : "left-0"
          } ${menuClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`group flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer transition-all duration-100 ${
                  isSelected
                    ? "bg-[#FFF8EE] text-[#8C5209] font-semibold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate flex-1 mr-2">
                  {renderDot(opt.dotColor)}
                  <div className="truncate">
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-[11px] text-slate-400 font-normal">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Checkmark in Sutlej Brand Accent */}
                {isSelected && (
                  <span className="shrink-0 text-[#E8A33D]">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
