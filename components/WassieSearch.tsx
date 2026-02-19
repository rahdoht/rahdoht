"use client";

import { useState, useRef } from "react";

const PLATITUDES = [
  "looks rare",
  "excuse me ser this is one of a kind",
  "omg is this yours?",
  "they're all good wassies, brent",
  "all wassies are rare",
  "1 wassie = 1 wassie",
  "you found a unique wassie!",
  "kill this rare wassie immediately",
  "perfect for wassie soup",
  "i think loomdart's mom wanted this one",
  "this wassie would look good under a rug",
  "so much lucky",
  "there can be only one",
  "ay imma i lan boi",
  "pump it loomdart",
  "probably nothing",
];

interface Trait {
  trait_type: string;
  value: string;
}

export function WassieSearch() {
  const [number, setNumber] = useState("");
  const [wassieSrc, setWassieSrc] = useState("");
  const [traits, setTraits] = useState<Trait[]>([]);
  const [platitude, setPlatitude] = useState("");
  const [showResult, setShowResult] = useState(false);
  const prevRef = useRef<string | null>(null);

  const lookup = async (n: string) => {
    if (!n || n === prevRef.current) return;
    prevRef.current = n;
    setWassieSrc(`https://arweave.net/ABckdetHKeV8VgUoIZ53TMDKkTi56LhTf-Gb1Mdqx9c/${n}.png`);
    const url = `https://fruuydfac2a4b4v5rip3ovqv5gg2sbaqgcgwnbnztlbt7xed7ela.arweave.net/LGlMDKAWgcDyvYoft1YV6Y2pBBAwjWaFuZrDP9yD-RY/${n}.json`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      setTraits(data.attributes ?? []);
    } catch {
      setTraits([]);
    }
    setPlatitude(PLATITUDES[Math.floor(Math.random() * PLATITUDES.length)]);
    setShowResult(true);
  };

  return (
    <div className="mt-4">
      <div className="flex gap-2 mb-4">
        <input
          type="number"
          min={0}
          max={12344}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup(number)}
          placeholder="Enter your wassie's number"
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
        />
        <button
          onClick={() => lookup(number)}
          className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded text-sm transition-colors"
        >
          →
        </button>
      </div>

      {wassieSrc && (
        <img
          src={wassieSrc}
          alt={`Wassie #${number}`}
          className="w-full max-h-96 object-contain mb-4"
          onError={() => setWassieSrc("")}
        />
      )}

      {showResult && (
        <>
          <div className="text-center mb-4">
            <div className="text-2xl font-bold">
              <span className="text-neutral-500">Rank</span> 1{" "}
              <span className="text-neutral-500">of</span> 12345
            </div>
            <div className="text-neutral-400 text-sm">{platitude}</div>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {traits.map((t) => (
                <tr key={t.trait_type} className="border-b border-neutral-800">
                  <td className="py-1 text-neutral-500">{t.trait_type}</td>
                  <td className="py-1 text-right">{t.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
