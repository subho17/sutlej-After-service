"use client";

import { useState } from "react";
import { LandingLoadingScreen, RoleSelector } from "@/components/global";

export default function Home() {
  const [loadingDone, setLoadingDone] = useState(false);

  return (
    <main className="min-h-screen w-full flex flex-col overflow-x-hidden bg-[#F8F9FA]">
      {/* Loading animation on first open */}
      {!loadingDone && (
        <LandingLoadingScreen
          duration={2400}
          onComplete={() => setLoadingDone(true)}
        />
      )}

      {/* Role selection opens after loading completes */}
      <section
        className={`flex-1 w-full flex items-center justify-center bg-[#F8F9FA] transition-opacity duration-700 ${
          loadingDone ? "opacity-100" : "opacity-0"
        }`}
      >
        {loadingDone && <RoleSelector />}
      </section>
    </main>
  );
}
