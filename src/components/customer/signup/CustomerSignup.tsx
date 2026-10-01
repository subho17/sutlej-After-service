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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Step 3 Final Submission → create account directly (auto-login via cookie)
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
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (formData.password !== confirmPassword) {
      setError("Passwords do not match. Please recheck.");
      return;
    }

    setLoading(true);

    try {
      const { ok, body } = await apiPost<{ name: string; customerId?: string | null }>(
        "/api/auth/customer/signup",
        {
          name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          password: formData.password,
          companyName: formData.companyName.trim(),
          gstNumber: formData.gstNumber.trim(),
          regNo: formData.registrationNo.trim(),
          model: formData.model.trim(),
          purchaseDate: formData.purchaseDate,
        }
      );
      if (!ok) {
        setError(body?.message ?? "Could not create account. Please try again.");
        return;
      }
      if (body?.data?.name) sessionStorage.setItem("customerName", body.data.name);
      if (body?.data?.customerId) sessionStorage.setItem("customerId", body.data.customerId);
      router.push("/customer");
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Choose a password (min 6 characters)"
                      className="w-full px-3.5 py-2.5 pr-11 rounded-lg border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#6366F1] transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* 10. Confirm password */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full px-3.5 py-2.5 pr-11 rounded-lg border border-slate-200 bg-[#FCFCFD] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#6366F1] transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
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
                    {loading ? "Creating..." : "Create account"}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 text-center pt-1 leading-relaxed">
                  You can add more vehicles to your account later from &quot;My Vehicles.&quot;
                </p>
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
