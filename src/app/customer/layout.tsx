"use client";

import React from "react";
import { AuthGuard } from "@/components/AuthGuard";

/**
 * The customer portal had no layout at all, so nothing stood between an
 * anonymous browser and pages whose every API call requires a session.
 */
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
