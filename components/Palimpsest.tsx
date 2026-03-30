"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { PackCanvas } from "./PackCanvas";
import { WalletConnect } from "./WalletConnect";
import { useMintPrice, useMint } from "@/lib/contract";
import { uploadImage, uploadMetadata } from "@/lib/ipfs";
import { formatEther } from "viem";

const IPFS_BASE = "https://bafybeigvhgkcqqamlukxcmjodalpk2kuy5qzqtx6m4i6pvb7o3ammss3y4.ipfs.dweb.link";

type MintStatus = "idle" | "uploading-image" | "uploading-metadata" | "minting" | "confirming" | "success" | "error";

function randomPackId() {
  return Math.floor(Math.random() * 9999) + 1;
}

export function Palimpsest() {
  const [packId, setPackId] = useState(randomPackId);
  const [text, setText] = useState("");
  const [parent, setParent] = useState(() => `${IPFS_BASE}/${randomPackId()}.jpg`);
  const [renderedDataUrl, setRenderedDataUrl] = useState<string>("");
  const [status, setStatus] = useState<MintStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const { isConnected } = useAccount();
  const { data: mintPrice } = useMintPrice();
  const { mint, isSuccess, txHash } = useMint();

  // Move tx-success watch out of render
  useEffect(() => {
    if (isSuccess && status === "minting") setStatus("success");
  }, [isSuccess]);

  const handlePackIdChange = (id: number) => {
    setPackId(id);
    setParent(`${IPFS_BASE}/${id}.jpg`);
  };

  const handleRender = useCallback((dataUrl: string) => {
    setRenderedDataUrl(dataUrl);
  }, []);

  const handleMint = async () => {
    if (!isConnected || !text.trim() || !mintPrice) return;
    setStatus("uploading-image");
    setErrorMsg("");

    try {
      const imageCid = await uploadImage(renderedDataUrl);
      setStatus("uploading-metadata");

      const metadata = {
        name: `Palimpsest`,
        description: "A palimpsest.",
        image: `ipfs://${imageCid}`,
        attributes: [
          { trait_type: "parent", value: parent },
          { trait_type: "base_pack", value: String(packId) },
        ],
      };
      const metaCid = await uploadMetadata(metadata);
      setStatus("minting");

      mint(parent, `ipfs://${metaCid}`, mintPrice as bigint);
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const statusLabel: Record<MintStatus, string> = {
    idle: "",
    "uploading-image": "Uploading image to IPFS…",
    "uploading-metadata": "Uploading metadata to IPFS…",
    minting: "Waiting for wallet confirmation…",
    confirming: "Transaction submitted, confirming…",
    success: "Minted! ✓",
    error: errorMsg,
  };

  const canMint = isConnected && text.trim() && mintPrice != null && status === "idle";

  const mintBlockedReason = !isConnected
    ? "connect wallet to mint"
    : !text.trim()
    ? "write something first"
    : mintPrice == null
    ? "fetching price… (are you on the right network?)"
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Pack selector */}
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Pack ID (1–9999)</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={9999}
            value={packId}
            onChange={(e) => handlePackIdChange(Math.max(1, Math.min(9999, Number(e.target.value))))}
            className="w-28 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
          />
          <button
            onClick={() => handlePackIdChange(randomPackId())}
            className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-sm px-3 py-2 rounded transition-colors"
          >
            random
          </button>
        </div>
      </div>

      {/* Canvas preview */}
      <div className="border border-neutral-800 rounded-lg overflow-hidden">
        <PackCanvas packId={packId} text={text} onRender={handleRender} />
      </div>

      {/* Text input */}
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Your text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your literature here"
          maxLength={500}
          rows={3}
          className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500 resize-none"
        />
        <div className="text-right text-xs text-neutral-600 mt-1">{text.length}/500</div>
      </div>

      {/* Parent field */}
      <div>
        <label className="block text-xs text-neutral-500 mb-1">
          Parent <span className="text-neutral-600">(what is this a response to?)</span>
        </label>
        <input
          type="text"
          value={parent}
          onChange={(e) => setParent(e.target.value)}
          placeholder="URL, book title, token ID, anything…"
          className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
        />
      </div>

      {/* Wallet + mint */}
      <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
        <WalletConnect />
        <div className="text-right">
          {mintPrice != null && (
            <div className="text-xs text-neutral-500 mb-2">
              {formatEther(mintPrice as bigint)} ETH
              <span className="ml-2 text-neutral-600">~ $8.50 (one pack)</span>
            </div>
          )}
          {mintBlockedReason && status === "idle" && (
            <div className="text-xs text-neutral-600 mb-2">{mintBlockedReason}</div>
          )}
          <button
            onClick={handleMint}
            disabled={!canMint}
            className="bg-white text-black font-bold px-6 py-2 rounded hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {status === "idle" ? "Mint" : statusLabel[status]}
          </button>
        </div>
      </div>

      {/* Status */}
      {statusLabel[status] && status !== "idle" && (
        <div
          className={`text-sm text-center p-3 rounded ${
            status === "error"
              ? "bg-red-950 text-red-400 border border-red-800"
              : status === "success"
              ? "bg-green-950 text-green-400 border border-green-800"
              : "bg-neutral-800 text-neutral-400"
          }`}
        >
          {statusLabel[status]}
          {status === "success" && txHash && (
            <div className="mt-1 text-xs text-neutral-500">
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                View on BaseScan
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
