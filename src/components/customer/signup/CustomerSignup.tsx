"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SutlejLogo } from "@/components/global";
import { apiPost } from "@/lib/api";

export interface CustomerSignupData {
  fullName: string;
  phone: string;
  email: string;
  companyName: string;
  gstNumber: string;
  registrationNo: string;
  model: string;
  purchaseDate: string;
  password: string;
}

export function CustomerSignup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [formData, setFormData] = useState<CustomerSignupData>({
    fullName: "",
    phone: "",
    email: "",
    companyName: "",
    gstNumber: "",
    registrationNo: "",
    model: "",
    purchaseDate: "2026-09-17",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Step 1 Validation -> Next
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setCurrentStep(2);
  };

  // Step 2 Validation -> Next
  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.registrationNo.trim()) {
      setError("Please enter your golf cart registration number.");
      return;
    }

    setCurrentStep(3);
  };

  // Step 3 Final Submission → request email OTP, then step 4 to verify
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.model.trim()) {
      setError("Please enter your golf cart model.");
      return;
    }
    if (!formData.purchaseDate) {
      setError("Please select the purchase/registration date.");
      return;
    }
    if (!formData.password) {
      setError("Please set a password.");
      return;
    }

    setLoading(true);

    try {
      const { ok, body } = await apiPost<unknown>("/api/auth/customer/signup/request", {
        name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      });
      if (!ok) {
        setError(body?.message ?? "Could not send verification code. Please try again.");
        return;
      }
      setOtp("");
      setCurrentStep(4);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 4 — verify OTP + create account (auto-login via cookie)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim()) {
      setError("Please enter the verification code sent to your email.");
      return;
    }

    setLoading(true);

    try {
      const { ok, body } = await apiPost<{ name: string }>(
        "/api/auth/customer/signup/verify",
        {
          email: formData.email.trim(),
          otp: otp.trim(),
          name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          companyName: formData.companyName.trim(),
          gstNumber: formData.gstNumber.trim(),
          regNo: formData.registrationNo.trim(),
          model: formData.model.trim(),
          purchaseDate: formData.purchaseDate,
        }
      );
      if (!ok) {
        setError(body?.message ?? "Could not verify code. Please try again.");
        return;
      }
      if (body?.data?.name) sessionStorage.setItem("customerName", body.data.name);
      router.push("/customer");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const { ok, body } = await apiPost<unknown>("/api/auth/customer/signup/request", {
        name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      });
      if (!ok) {
        setError(body?.message ?? "Could not resend code. Please try again.");
        return;
      }
      setOtp("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#6366F1] font-sans p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14 py-4">
        {/* Left Column (Brand Identity) */}
        <div className="hidden lg:flex flex-col justify-center max-w-lg text-white">
          <div className="mb-8 flex items-center gap-4">
            <SutlejLogo size="md" theme="dark" showText={false} />
            <span className="text-3xl font-bold tracking-tight">Sutlej</span>
          </div>

          <h1 className="text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            Hey, Hello!
          </h1>

          <p className="text-2xl font-medium mb-6 text-white/90">
            Welcome to the Customer Portal
          </p>

          <p className="text-lg text-white/80 leading-relaxed mb-8">
            Register your golf cart, track service requests, order genuine spares, and interact with support seamlessly through our integrated customer desk.
          </p>

          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white font-medium text-sm transition-colors"
            >
              <span>‹</span> Back to role selection
            </Link>
          </div>
        </div>

        {/* Right Column (Card with 3 Inputs per Step) */}
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white w-full rounded-3xl shadow-2xl p-8 sm:p-10 transition-all">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-1.5">Create Account</h2>
                <p className="text-sm text-gray-500">
                  {currentStep === 1 && "Step 1 of 3: Your Personal Details"}
                  {currentStep === 2 && "Step 2 of 3: Company & Golf Cart"}
                  {currentStep === 3 && "Step 3 of 3: Vehicle Specs & Password"}
                  {currentStep === 4 && "Step 4 of 4: Verify Your Email"}
                </p>

              {/* Step Progress Dots / Bars */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep === 1
                      ? "w-8 bg-[#6366F1]"
                      : "w-5 bg-indigo-200"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep === 2
                      ? "w-8 bg-[#6366F1]"
                      : currentStep > 2
                      ? "w-5 bg-indigo-200"
                      : "w-5 bg-gray-200"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep === 3
                      ? "w-8 bg-[#6366F1]"
                      : currentStep > 3
                      ? "w-5 bg-indigo-200"
                      : "w-5 bg-gray-200"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep === 4
                      ? "w-8 bg-[#6366F1]"
                      : "w-5 bg-gray-200"
                  }`}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            {/* ================= STEP 1 (3 INPUTS) ================= */}
            {currentStep === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-4">
                {/* 1. Full name */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Harpreet Kaur"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                    required
                  />
                </div>

                {/* 2. Phone number */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 98140 00000"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                    required
                  />
                </div>

                {/* 3. Email / Gmail ID */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    Email / Gmail ID{" "}
                    <span className="font-normal text-slate-400 text-xs">
                      (used for password recovery)
                    </span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                    required
                  />
                </div>

                {/* Next Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white font-bold text-sm sm:text-base transition-colors duration-200 shadow-md shadow-[#6366F1]/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Next</span>
                    <span>→</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= STEP 2 (AGAIN 3 INPUTS) ================= */}
            {currentStep === 2 && (
              <form onSubmit={handleStep2Next} className="space-y-4">
                <span className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  COMPANY DETAILS (OPTIONAL)
                </span>

                {/* 4. Company name */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    Company name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="e.g. Green Valley Golf Resort"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                  />
                </div>

                {/* 5. GST number */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    GST number
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="e.g. 03ABCDE1234F1Z5"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all uppercase"
                  />
                </div>

                <span className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase pt-1">
                  YOUR GOLF CART
                </span>

                {/* 6. Registration no. */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    Registration no.
                  </label>
                  <input
                    type="text"
                    name="registrationNo"
                    value={formData.registrationNo}
                    onChange={handleChange}
                    placeholder="e.g. PB-10-GC-0451"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all uppercase"
                    required
                  />
                </div>

                {/* Back and Next Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="py-3 px-5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white font-bold text-sm sm:text-base transition-colors duration-200 shadow-md shadow-[#6366F1]/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Next</span>
                    <span>→</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= STEP 3 (FINAL 3 INPUTS) ================= */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <span className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  GOLF CART SPECS & PASSWORD
                </span>

                {/* 7. Model */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g. Club Car Tempo"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                    required
                  />
                </div>

                {/* 8. Purchase / registration date */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    Purchase / registration date
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                    required
                  />
                </div>

                {/* 9. Set a password */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    Set a password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Choose a password"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                    required
                  />
                </div>

                {/* Back and Final Submit Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="py-3 px-5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-60 text-white font-bold text-sm sm:text-base transition-colors duration-200 shadow-md shadow-[#6366F1]/20 cursor-pointer"
                  >
                    {loading ? "Sending..." : "Send verification code"}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 text-center pt-1 leading-relaxed">
                  You can add more vehicles to your account later from &quot;My Vehicles.&quot;
                </p>
              </form>
            )}

            {/* ================= STEP 4 (EMAIL OTP VERIFICATION) ================= */}
            {currentStep === 4 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <span className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  VERIFY YOUR EMAIL
                </span>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-slate-900">{formData.email}</span>.
                  Enter it below to finish creating your account.
                </p>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    Verification code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all tracking-widest text-center font-mono font-bold"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-60 text-white font-bold text-sm sm:text-base transition-colors duration-200 shadow-md shadow-[#6366F1]/20 cursor-pointer"
                >
                  {loading ? "Verifying..." : "Verify & create account"}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-gray-500 hover:text-[#6366F1] font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-xs text-[#6366F1] hover:underline font-semibold disabled:opacity-60"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}

            {/* Footer Navigation Links */}
            <div className="text-center mt-6 pt-5 border-t border-gray-100 space-y-2">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/customer/login"
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

export default CustomerSignup;
