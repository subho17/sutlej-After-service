"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { StaffShell } from "@/components/staff";
import { AuthGuard } from "@/components/AuthGuard";

const HIDE_NAVBAR_ROUTES = ["/staff", "/staff/login", "/staff/forgot-password"];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNavbar = HIDE_NAVBAR_ROUTES.includes(pathname);

  // AuthGuard bounces a tab without a sutlej_token cookie to /staff/login —
  // every API route is behind requireAuth, so that tab would otherwise render
  // empty lists forever and poll a 401 every 20s.
  return (
    <AuthGuard>
      {hideNavbar ? (
        // Login & Forgot Password pages render full-screen
        <div className="min-h-screen flex flex-col">{children}</div>
      ) : (
        <StaffShell>{children}</StaffShell>
      )}
    </AuthGuard>
  );
}
