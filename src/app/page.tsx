"use client";

import { useState } from "react";
import { LandingLoadingScreen, RoleSelector } from "@/components/global";

export default function Home() {
  const [loadingDone, setLoadingDone] = useState(false);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Loading animation on first open */}
      {!loadingDone && (
        <LandingLoadingScreen
          duration={2400}
          onComplete={() => setLoadingDone(true)}
        />
      )}

      {/* Role selection opens after loading completes */}
      <section
        className={`flex-1 flex items-center justify-center bg-[#0B0F17] transition-opacity duration-700 ${
          loadingDone ? "opacity-100" : "opacity-0"
        }`}
      >
        {loadingDone && <RoleSelector />}
      </section>
    </main>
  );
}
