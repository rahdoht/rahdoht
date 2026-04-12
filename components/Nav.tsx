"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Donation } from "./Donation";

const NAV_ITEMS = [
  { href: "/", label: "welcome", icon: "🛋" },
  { href: "/wassies", label: "wassies", icon: "🐧" },
  { href: "/smoke", label: "smoke", icon: "🌫️" },
  { href: "/allons-jouer", label: "allons jouer", icon: "🪗" },
  ...(process.env.NEXT_PUBLIC_PALIMPSEST_ENABLED === "true"
    ? [{ href: "/palimpsest", label: "palimpsest", icon: "🚬" }]
    : []),
];

const COINS = [
  { name: "eth", url: "/eth.png", address: "0x7A26f2A0B0bFe00E9c6f5E7Cf1206eEeB40245d0" },
  { name: "sol", url: "/sol.png", address: "GxY4Ph2zZ2dKxNQCgfYBm7w5uxnRu4MXW8v6scx1Wp6S" },
  { name: "btc", url: "/btc.png", address: "bc1q26yf733g6v5qydxrwmadnaw0mtt6xfsmnwrnee" },
];

export function Nav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-52 bg-neutral-900 border-r border-neutral-800 flex flex-col transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-4 text-lg font-bold border-b border-neutral-800">rahdoht</div>
        <nav className="flex-1 p-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                pathname === item.href
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <footer className="p-4 border-t border-neutral-800 text-xs text-neutral-500">
          <div className="mb-2">farthing for a meme? click to copy.</div>
          <div className="flex gap-1">
            {COINS.map((coin) => (
              <Donation key={coin.name} coin={coin} />
            ))}
          </div>
          <div className="mt-2">&copy; {new Date().getFullYear()}</div>
        </footer>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-52">
        <header className="sticky top-0 z-20 bg-neutral-950/80 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center gap-3 md:hidden">
          <button onClick={() => setOpen(true)} className="text-neutral-400 hover:text-white">
            ☰
          </button>
          <span className="font-bold">rahdoht</span>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
