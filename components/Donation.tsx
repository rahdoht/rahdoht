"use client";

import { useState } from "react";

interface Coin {
  name: string;
  url: string;
  address: string;
}

export function Donation({ coin }: { coin: Coin }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await navigator.clipboard.writeText(coin.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1234);
  };

  return (
    <span className="relative group">
      <button onClick={handleClick} title={coin.address} className="align-middle mx-1">
        <img src={coin.url} alt={coin.name} className="h-4 inline" />
      </button>
      {copied && (
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neutral-800 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {coin.name} wallet address copied to clipboard
        </span>
      )}
    </span>
  );
}
