"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { StaffNavbar } from "@/components/staff";

const HIDE_NAVBAR_ROUTES = ["/staff", "/staff/login", "/staff/forgot-password"];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNavbar = HIDE_NAVBAR_ROUTES.includes(pathname);

  if (hideNavbar) {
    // Login pages render full-screen without staff navbar
    return <div className="min-h-screen flex flex-col">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-white">
      <StaffNavbar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
