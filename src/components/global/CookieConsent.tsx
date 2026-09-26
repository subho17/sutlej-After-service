"use client";

import React, { useState, useEffect } from "react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted or declined cookies
    const consent = localStorage.getItem("sutlej_cookie_consent");
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("sutlej_cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("sutlej_cookie_consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none animate-in slide-in-from-right-10 fade-in duration-500">
      <div className="pointer-events-auto w-[360px] rounded-2xl bg-white border border-gray-200 shadow-[0_12px_40px_rgb(0,0,0,0.08)] p-5 flex flex-col gap-4">
        <div>
          <h3 className="text-[15px] font-bold text-gray-900 mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#008CEE]">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
              <path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/>
            </svg>
            Cookie Preferences
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={handleDecline}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors duration-200"
          >
            Decline
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#008CEE] hover:bg-[#0073DC] text-white text-sm font-semibold transition-colors duration-200 shadow-sm"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
