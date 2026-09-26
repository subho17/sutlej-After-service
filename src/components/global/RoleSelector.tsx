"use client";

import React from "react";
import Link from "next/link";
import { CookieConsent } from "./CookieConsent";

export function RoleSelector() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[#F8F9FA] p-6 font-sans">
      <div className="text-center mb-16 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#0f172a] tracking-tight mb-4">
          Sutlej Automotives
        </h2>
        <p className="text-base text-gray-500 leading-relaxed max-w-lg mx-auto">
          After-sales service desk — continue as staff or as a registered customer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Staff Desk Card */}
        <Link 
          href="/staff/login" 
          className="group flex flex-col p-8 md:p-10 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-[#008CEE]/30 hover:shadow-[0_12px_40px_rgb(0,140,238,0.08)] transition-all duration-500 ease-out translate-y-0 hover:-translate-y-1.5 relative animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 bg-slate-50 group-hover:bg-[#008CEE]/5 group-hover:text-[#008CEE] group-hover:scale-110 mb-8 transition-all duration-500 ease-out">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#0f172a] mb-3 group-hover:text-[#008CEE] transition-colors duration-300">
            Staff desk
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            Register complaints, manage spares, track orders, post offers, and view service reminders.
          </p>
        </Link>

        {/* Customer Portal Card */}
        <Link 
          href="/customer/login" 
          className="group flex flex-col p-8 md:p-10 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-[#008CEE]/30 hover:shadow-[0_12px_40px_rgb(0,140,238,0.08)] transition-all duration-500 ease-out translate-y-0 hover:-translate-y-1.5 relative animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 bg-slate-50 group-hover:bg-[#008CEE]/5 group-hover:text-[#008CEE] group-hover:scale-110 mb-8 transition-all duration-500 ease-out">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#0f172a] mb-3 group-hover:text-[#008CEE] transition-colors duration-300">
            Customer portal
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            Raise complaints, order spares, track every vehicle&apos;s service schedule, and see offers.
          </p>
        </Link>
      </div>

      <CookieConsent />
    </div>
  );
}
