"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const SmokeText = dynamic(
  () => import("./SmokeText").then((m) => m.SmokeText),
  { ssr: false }
);

export function SmokeClient() {
  const [text, setText] = useState("");

  return (
    <>
      <SmokeText text={text} />

      {/* Input zone — fixed at bottom, fades from transparent */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "20px 24px 28px",
          background: "linear-gradient(to top, rgba(10,8,7,0.97) 60%, transparent)",
        }}
      >
        <label
          htmlFor="smoke-input"
          style={{
            display: "block",
            fontFamily: "'EB Garamond', Georgia, serif",
            fontStyle: "italic",
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "#6b5e4a",
            marginBottom: 6,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          exhale
        </label>
        <textarea
          id="smoke-input"
          rows={2}
          maxLength={500}
          placeholder="Write your literature here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 520,
            display: "block",
            margin: "0 auto",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(212,197,169,0.12)",
            borderRadius: 2,
            color: "#d4c5a9",
            fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: 16,
            lineHeight: 1.5,
            padding: "10px 14px",
            resize: "none",
            outline: "none",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,197,169,0.3)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(212,197,169,0.12)")}
        />
      </div>
    </>
  );
}
