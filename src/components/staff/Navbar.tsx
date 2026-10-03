"use client";

export * from "./StaffShell";
export { default as StaffShell } from "./StaffShell";

/**
 * Backward compatibility: StaffNavbar now renders StaffShell header or proxies to StaffShell
 */
export function StaffNavbar() {
  return null; // Header is integrated directly inside StaffShell
}

export default StaffNavbar;
