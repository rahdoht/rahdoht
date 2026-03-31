"use client";

import dynamic from "next/dynamic";

// Palimpsest uses random init state + wagmi hooks — skip SSR to avoid hydration mismatch
export const PalimpsestClient = dynamic(
  () => import("./Palimpsest").then((m) => m.Palimpsest),
  { ssr: false, loading: () => <p className="text-sm text-neutral-500">loading…</p> }
);
