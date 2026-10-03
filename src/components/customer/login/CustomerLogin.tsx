"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SutlejLogo } from "@/components/global";
import { apiPost } from "@/lib/api";
import { reportAuthorized } from "@/lib/session";

interface CustomerLoginData {
  name: string;
  customerId?: string | null;
  phone?: string | null;
}

export function CustomerLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError("Please enter your Phone / Email and password.");
      return;
    }

    setLoading(true);
    try {
      const { ok, body } = await apiPost<CustomerLoginData>("/api/auth/customer/login", {
        identifier: identifier.trim(),
        password,
      });
      if (!ok) {
        setError(body?.message ?? "Invalid credentials. Please try again.");
        return;
      }
      if (body?.data?.name) sessionStorage.setItem("customerName", body.data.name);
      if (body?.data?.customerId) sessionStorage.setItem("customerId", body.data.customerId);
      // This customer's own number — used when they raise a complaint.
      if (body?.data?.phone) sessionStorage.setItem("customerPhone", body.data.phone);
      else sessionStorage.removeItem("customerPhone");
      // The cookie is set: tell the AuthGuard before the home page mounts so
      // its first sync is not blocked by a stale "signed-out".
      reportAuthorized();
      router.push("/customer");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#6366F1] font-sans p-4 sm:p-8 lg:p-12">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
        {/* Left side text content */}
        <div className="hidden lg:flex flex-col justify-center max-w-lg text-white">
          <div className="mb-10 flex items-center gap-4">
            <SutlejLogo size="md" theme="dark" showText={false} />
            <span className="text-3xl font-bold tracking-tight">Sutlej</span>
          </div>

          <h1 className="text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            Hey, Hello!
          </h1>

          <p className="text-2xl font-medium mb-6 text-white/90">
            Welcome to the Customer Portal
          </p>

          <p className="text-lg text-white/80 leading-relaxed">
            Access your golf carts, track maintenance schedules, order genuine spares, and raise service requests seamlessly through our integrated portal.
          </p>
        </div>

        {/* Right side login card */}
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white w-full rounded-3xl shadow-2xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back</h2>
              <p className="text-sm text-gray-500">Log in to access your customer dashboard.</p>
            </div>

            {error && (
              <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Phone number or Email"
                  autoComplete="username"
                  className="w-full px-5 py-3.5 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full px-5 py-3.5 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm"
                  required
                />
              </div>

              <div className="flex justify-end">
                <Link
                  href="/customer/forgot-password"
                  className="text-sm text-gray-600 hover:text-[#6366F1] font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-60 text-white font-semibold text-base transition-colors duration-200 shadow-lg shadow-[#6366F1]/30 cursor-pointer"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="flex items-center gap-4 my-7">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400 font-medium tracking-wider">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="flex gap-4 mb-7">
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-700 font-medium text-sm transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-700 font-medium text-sm transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5 text-[#1877F2]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>

            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/customer/signup"
                  className="text-[#6366F1] font-semibold hover:underline"
                >
                  Sign Up
                </Link>
              </p>

              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#6366F1] font-medium transition-colors"
                >
                  <span>‹</span> Back to role selection
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerLogin;
