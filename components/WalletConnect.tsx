"use client";

import { useAccount, useConnect, useDisconnect, useConnectors } from "wagmi";

function truncate(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-400">{chain?.name}</span>
        <button
          onClick={() => disconnect()}
          className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-sm px-3 py-1.5 rounded transition-colors"
        >
          {truncate(address)}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending || connectors.length === 0}
      className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-sm px-3 py-1.5 rounded transition-colors disabled:opacity-50"
    >
      {isPending ? "connecting…" : "Connect Wallet"}
    </button>
  );
}
