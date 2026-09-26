"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SutlejLogo } from "@/components/global";
import { API_BASE } from "@/lib/demoStaff";

export function StaffForgotPassword() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState<"request" | "verify" | "success">("request");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError("Please enter your Staff ID / Email / Phone.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/staff/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "Could not send reset code. Please try again.");
        return;
      }
      setStep("verify");
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/staff/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "Could not reset password. Please try again.");
        return;
      }
      setStep("success");
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#6366F1] font-sans p-4 sm:p-8 lg:p-12">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
        {/* Left side brand text */}
        <div className="hidden lg:flex flex-col justify-center max-w-lg text-white">
          <div className="mb-10 flex items-center gap-4">
            <SutlejLogo size="md" theme="dark" showText={false} />
            <span className="text-3xl font-bold tracking-tight">Sutlej</span>
          </div>

          <h1 className="text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            Account Recovery
          </h1>

          <p className="text-2xl font-medium mb-6 text-white/90">
            Forgot your password?
          </p>

          <p className="text-lg text-white/80 leading-relaxed">
            Enter your staff details — the reset code is sent to the admin inbox
            for approval, then create your new password.
          </p>
        </div>

        {/* Right side card */}
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white w-full rounded-3xl shadow-2xl p-8 sm:p-10">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#6366F1] shadow-sm">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            {/* STEP 1: Request Reset */}
            {step === "request" && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h2>
                  <p className="text-sm text-gray-500">
                    Enter your Staff ID, email or phone number. The reset code
                    goes to the admin for approval.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Staff ID / Email / Phone"
                      className="w-full px-5 py-3.5 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-60 text-white font-semibold text-base transition-colors duration-200 shadow-lg shadow-[#6366F1]/30 cursor-pointer"
                  >
                    {loading ? "Sending..." : "Send Reset Code"}
                  </button>
                </form>
              </>
            )}

            {/* STEP 2: Verify OTP & New Password */}
            {step === "verify" && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                  <p className="text-xs text-gray-500">
                    Enter the code shared by the admin for{" "}
                    <span className="font-semibold text-gray-800">{identifier}</span>
                  </p>
                </div>

                {error && (
                  <div className="mb-4 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                    {error}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="w-full px-5 py-3.5 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm tracking-widest text-center font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full px-5 py-3.5 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-5 py-3.5 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-60 text-white font-semibold text-base transition-colors duration-200 shadow-lg shadow-[#6366F1]/30 cursor-pointer"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("request")}
                      className="text-xs text-gray-500 hover:text-[#6366F1] font-medium"
                    >
                      ← Change staff details
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* STEP 3: Success Confirmation */}
            {step === "success" && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                  Password Reset Complete!
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  Your password has been successfully updated. You can now log in with your new credentials.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/staff/login")}
                  className="w-full py-3.5 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold text-base transition-colors duration-200 shadow-lg shadow-[#6366F1]/30 cursor-pointer"
                >
                  Go to Login
                </button>
              </div>
            )}

            {/* Footer Back Links */}
            <div className="text-center space-y-3 mt-7 pt-5 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <Link
                  href="/staff/login"
                  className="text-[#6366F1] font-semibold hover:underline"
                >
                  Log In
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

export default StaffForgotPassword;
