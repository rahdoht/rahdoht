"use client";

import { useEffect, useState, useRef } from "react";
import { putLabel } from "@/lib/putLabel";

interface PackCanvasProps {
  packId: number;
  text: string;
  onRender?: (dataUrl: string) => void;
}

export function PackCanvas({ packId, text, onRender }: PackCanvasProps) {
  const [src, setSrc] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use local proxy to avoid canvas CORS taint from IPFS gateways
  const imageUrl = `/api/pack/${packId}`;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setSrc(imageUrl);
      onRender?.(imageUrl);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await putLabel(imageUrl, text);
        setSrc(result);
        onRender?.(result);
      } catch (e) {
        console.error("putLabel error:", e);
        setSrc(imageUrl);
      } finally {
        setLoading(false);
      }
    }, 150); // debounce keystrokes
  }, [packId, text]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
          <span className="text-sm text-neutral-400">rendering…</span>
        </div>
      )}
      {src && (
        <img
          src={src}
          alt={`Pack #${packId}`}
          className="w-full rounded"
        />
      )}
    </div>
  );
}
