import { RahdohtLogo } from "@/components/RahdohtLogo";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="w-full max-w-xs mx-auto mb-4">
            <RahdohtLogo />
          </div>
          <h1 className="text-xl font-bold mb-1">bienvenue au jardin de rahdoht</h1>
          <p className="text-neutral-500 text-sm mb-4">just a couch doing its part</p>
          <div className="mb-4">
            <Link href="/wassies" className="text-blue-400 hover:underline text-sm">
              All Wassies Are Rare Calculator
            </Link>
          </div>
          <div className="flex gap-3 justify-end">
            <a href="https://twitter.com/rahdoht" target="_blank" rel="noreferrer">
              <img src="/twitter.svg" alt="twitter" className="h-7" />
            </a>
            <a href="https://github.com/rahdoht" target="_blank" rel="noreferrer">
              <img src="/github.png" alt="github" className="h-7" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
