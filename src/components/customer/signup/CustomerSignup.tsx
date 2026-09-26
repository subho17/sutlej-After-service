"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SutlejLogo } from "@/components/global";

export interface CustomerSignupData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  registrationNo: string;
  model: string;
  purchaseDate: string;
  companyName?: string;
  gstNumber?: string;
}

export function CustomerSignup() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState<CustomerSignupData>({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    registrationNo: "",
    model: "",
    purchaseDate: "2026-09-17",
    companyName: "",
    gstNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.password) {
      setError("Please fill in all account fields to proceed.");
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.registrationNo.trim() || !formData.model.trim()) {
      setError("Please enter your golf cart registration number and model.");
      return;
    }

    setLoading(true);

    try {
      const customerRecord = {
        name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        companyName: formData.companyName?.trim() || null,
        gstNumber: formData.gstNumber?.trim() || null,
        vehicle: {
          registrationNo: formData.registrationNo.trim(),
          model: formData.model.trim(),
          purchaseDate: formData.purchaseDate,
        },
      };

      sessionStorage.setItem("customerUser", JSON.stringify(customerRecord));
      sessionStorage.setItem("customerName", customerRecord.name);

      router.push("/customer/login");
    } catch {
      setError("An unexpected error occurred. Please try again.");
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
            Create your account to register golf carts, access fast service requests, order genuine spares, and manage maintenance records.
          </p>
        </div>

        {/* Right side signup card (Exact matching design) */}
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white w-full rounded-3xl shadow-2xl p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-sm text-gray-500">Sign up to access your customer dashboard.</p>
              
              {/* Stepper Indicator */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
                    step === 1
                      ? "bg-[#6366F1] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  1. Account
                </button>
                <div className="w-4 h-0.5 bg-gray-200" />
                <button
                  type="button"
                  onClick={() => {
                    if (formData.fullName && formData.phone && formData.email && formData.password) {
                      setStep(2);
                    }
                  }}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
                    step === 2
                      ? "bg-[#6366F1] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  2. Golf Cart
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            {/* STEP 1: Account Information */}
            {step === 1 ? (
              <form className="space-y-4" onSubmit={handleNextStep}>
                <div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full name (e.g. Harpreet Kaur)"
                    className="w-full px-5 py-3.5 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone number (e.g. 98140 00000)"
                    className="w-full px-5 py-3.5 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email / Gmail ID"
                    className="w-full px-5 py-3.5 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Set a password"
                    className="w-full px-5 py-3.5 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 mt-2 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold text-base transition-colors duration-200 shadow-lg shadow-[#6366F1]/30 cursor-pointer"
                >
                  Continue to Vehicle Details →
                </button>

                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-400 font-medium tracking-wider">OR</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <div className="flex gap-4 mb-6">
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
              </form>
            ) : (
              /* STEP 2: Golf Cart & Company Information */
              <form className="space-y-3.5" onSubmit={handleSubmit}>
                <div>
                  <input
                    type="text"
                    name="registrationNo"
                    value={formData.registrationNo}
                    onChange={handleChange}
                    placeholder="Registration no. (e.g. PB-10-GC-0451)"
                    className="w-full px-5 py-3 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm uppercase"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Golf Cart Model (e.g. Club Car Tempo)"
                    className="w-full px-5 py-3 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    title="Purchase / registration date"
                    className="w-full px-5 py-2.5 rounded-full border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Company name (Optional)"
                    className="w-full px-5 py-3 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="GST number (Optional)"
                    className="w-full px-5 py-3 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm uppercase"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-3.5 px-5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-60 text-white font-semibold text-base transition-colors duration-200 shadow-lg shadow-[#6366F1]/30 cursor-pointer"
                  >
                    {loading ? "Creating..." : "Create Account"}
                  </button>
                </div>

                <p className="text-[11px] text-gray-400 text-center pt-1">
                  You can add more vehicles to your account later from &quot;My Vehicles.&quot;
                </p>
              </form>
            )}

            {/* Footer Links */}
            <div className="text-center space-y-3 mt-6 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/customer/login"
                  className="text-[#6366F1] font-semibold hover:underline"
                >
                  Sign In
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
