"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import {
  getSessionStatus,
  reportAuthorized,
  reportUnauthorized,
  resetSession,
  subscribeSession,
} from "@/lib/session";

/** Routes that must stay reachable without a session. */
const PUBLIC_PATHS = new Set([
  "/",
  "/staff",
  "/staff/login",
  "/staff/forgot-password",
  "/customer/login",
  "/customer/signup",
  "/customer/forgot-password",
]);

function loginPathFor(pathname: string): string {
  return pathname.startsWith("/staff") ? "/staff/login" : "/customer/login";
}

export interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Keeps a signed-out tab off the data pages.
 *
 * The portals used to read a 401 from the API as "this list is empty", so a
 * browser without the sutlej_token cookie showed "No orders yet" with nothing
 * to explain it — while polling re-asked every 20s. This proves the cookie
 * with GET /api/auth/me whenever a protected route is entered, and turns any
 * later 401 into a redirect to that portal's own login page.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  // The subscriber below has to see the path we are on *now*, not the one it
  // closed over when the effect ran.
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // A session can die while the tab just sits there, with no navigation to
  // re-check it — that is when a 401 from a poll has to bounce us.
  useEffect(() => {
    return subscribeSession((next) => {
      if (next !== "signed-out") return;
      const current = pathnameRef.current;
      if (PUBLIC_PATHS.has(current)) return;
      router.replace(loginPathFor(current));
    });
  }, [router]);

  // Entering a protected route: confirm the cookie before the page renders
  // its empty state as if it were real. Skipped while we already believe we
  // are signed in, so a normal session costs one request per full page load.
  useEffect(() => {
    if (PUBLIC_PATHS.has(pathname)) return;
    if (getSessionStatus() === "signed-in") return;

    let cancelled = false;
    apiGet("/api/auth/me")
      .then(({ status }) => {
        if (cancelled) return;
        if (status === 401) {
          reportUnauthorized();
          router.replace(loginPathFor(pathname));
        } else if (status === 200) {
          reportAuthorized();
        } else {
          resetSession();
        }
      })
      .catch(() => {
        // Backend unreachable: forget the guess rather than bounce anyone.
        if (!cancelled) resetSession();
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return <>{children}</>;
}

export default AuthGuard;
