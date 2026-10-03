"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type AlertType = "success" | "warning" | "error" | "info";

export interface ToastAlert {
  id: string;
  type: AlertType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "primary";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface StaffAlertContextType {
  showToast: (toast: Omit<ToastAlert, "id">) => void;
  showSuccess: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showConfirm: (options: ConfirmDialogOptions) => void;
}

const StaffAlertContext = createContext<StaffAlertContextType | undefined>(undefined);

export function useStaffAlert(): StaffAlertContextType {
  const context = useContext(StaffAlertContext);
  if (!context) {
    throw new Error("useStaffAlert must be used within a StaffAlertProvider");
  }
  return context;
}

export function StaffAlertProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastAlert, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastAlert = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => showToast({ type: "success", title, message }),
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => showToast({ type: "warning", title, message }),
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string) => showToast({ type: "error", title, message }),
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => showToast({ type: "info", title, message }),
    [showToast]
  );

  const showConfirm = useCallback((options: ConfirmDialogOptions) => {
    setConfirmDialog(options);
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try {
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch {
      // on error, keep dialog open or handled by caller
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancelAction = () => {
    if (confirmDialog?.onCancel) {
      confirmDialog.onCancel();
    }
    setConfirmDialog(null);
  };

  return (
    <StaffAlertContext.Provider
      value={{
        showToast,
        showSuccess,
        showWarning,
        showError,
        showInfo,
        showConfirm,
      }}
    >
      {children}

      {/* ===================================================================== */}
      {/* TOAST ALERTS CONTAINER (Top-Right Floating)                            */}
      {/* ===================================================================== */}
      <div className="fixed top-19 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isWarning = toast.type === "warning";
          const isError = toast.type === "error";
          const isInfo = toast.type === "info";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in bg-white ${
                isSuccess
                  ? "border-emerald-200/90 text-emerald-950"
                  : isWarning
                  ? "border-amber-200/90 text-amber-950"
                  : isError
                  ? "border-rose-200/90 text-rose-950"
                  : "border-blue-200/90 text-blue-950"
              }`}
            >
              {/* Type Icon Badge */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                  isSuccess
                    ? "bg-emerald-600 shadow-xs"
                    : isWarning
                    ? "bg-amber-500 shadow-xs"
                    : isError
                    ? "bg-rose-500 shadow-xs"
                    : "bg-blue-600 shadow-xs"
                }`}
              >
                {isSuccess && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isWarning && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {isError && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="9" strokeWidth={2} />
                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth={2} strokeLinecap="round" />
                    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                )}
                {isInfo && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="9" strokeWidth={2} />
                    <line x1="12" y1="16" x2="12" y2="12" strokeWidth={2} strokeLinecap="round" />
                    <circle cx="12" cy="8" r="1" fill="currentColor" />
                  </svg>
                )}
              </div>

              {/* Title & Description */}
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                    {toast.message}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* CONFIRMATION ALERT MODAL (Centered with Backdrop)                     */}
      {/* ===================================================================== */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={handleCancelAction}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 z-10 border border-gray-200/90 animate-in zoom-in-95 fade-in duration-150">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmDialog.type === "danger"
                    ? "bg-rose-100 text-rose-600"
                    : confirmDialog.type === "warning"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {confirmDialog.type === "danger" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  ) : confirmDialog.type === "warning" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelAction}
                disabled={confirmLoading}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                {confirmDialog.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className={`px-4 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  confirmDialog.type === "danger"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : confirmDialog.type === "warning"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmLoading ? (
                  <span>Processing...</span>
                ) : (
                  <span>{confirmDialog.confirmText || "Confirm"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffAlertContext.Provider>
  );
}
