"use client";

import { useRef, useEffect } from "react";
import { prepareWithSegments, layoutNextLine, type LayoutCursor } from "@chenglou/pretext";
import { createNoise2D } from "simplex-noise";
import { bezierPoint, plumeWidth, animateControlPoints } from "@/lib/smokeGeometry";

interface SmokeTextProps {
  text: string;
  width: number;
  height: number;
}

const SLOT_COUNT = 25;
const DRIFT_SPEED = 0.4; // px per frame
const FONT = "13px monospace";
const CHAR_SPACING = 8; // px between characters

interface Slot {
  y: number;
  lineText: string;
}

function drawCigarette(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Body (white cylinder, horizontal)
  ctx.fillStyle = "#f0f0e8";
  ctx.fillRect(x - 30, y - 4, 44, 8);

  // Filter (amber)
  ctx.fillStyle = "#c8824a";
  ctx.fillRect(x + 14, y - 4, 10, 8);

  // Ember glow
  const glow = ctx.createRadialGradient(x - 30, y, 0, x - 30, y, 8);
  glow.addColorStop(0, "rgba(255, 140, 20, 0.9)");
  glow.addColorStop(0.4, "rgba(255, 60, 0, 0.5)");
  glow.addColorStop(1, "rgba(255, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x - 30, y, 8, 0, Math.PI * 2);
  ctx.fill();
}

export function SmokeText({ text, width, height }: SmokeTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    slots: Slot[];
    cursor: LayoutCursor;
    noise2D: (x: number, y: number) => number;
    animFrameId: number;
    time: number;
    currentText: string;
  } | null>(null);

  // Tip of cigarette ember — smoke rises from here
  const tipX = width / 2;
  const tipY = height - 30;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const noise2D = createNoise2D();

    // Initialize slots evenly spaced upward from tip
    const slots: Slot[] = Array.from({ length: SLOT_COUNT }, (_, i) => ({
      y: tipY - i * (height / SLOT_COUNT),
      lineText: "",
    }));

    const initialCursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    stateRef.current = {
      slots,
      cursor: initialCursor,
      noise2D,
      animFrameId: 0,
      time: 0,
      currentText: text,
    };

    function getNextLine(t: string, cursor: LayoutCursor, maxWidth: number): { text: string; cursor: LayoutCursor } {
      if (!t.trim()) return { text: "", cursor };
      try {
        const prepared = prepareWithSegments(t, FONT);
        const line = layoutNextLine(prepared, cursor, Math.max(maxWidth, 10));
        if (line === null) {
          // Exhausted — restart
          const freshCursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
          const firstLine = layoutNextLine(prepared, freshCursor, Math.max(maxWidth, 10));
          if (!firstLine) return { text: t, cursor: freshCursor };
          return { text: firstLine.text, cursor: firstLine.end };
        }
        return { text: line.text, cursor: line.end };
      } catch {
        return { text: t.slice(0, 20), cursor };
      }
    }

    function frame() {
      const state = stateRef.current!;
      state.time += 16;
      ctx.clearRect(0, 0, width, height);

      const [cp1, cp2] = animateControlPoints(height, tipX, state.time);
      const p0 = { x: tipX, y: tipY };
      const p3 = { x: tipX, y: 0 };

      // Draw cigarette
      drawCigarette(ctx, tipX, tipY);

      ctx.font = FONT;
      ctx.textBaseline = "top";

      for (const slot of state.slots) {
        // Scroll upward
        slot.y -= DRIFT_SPEED;

        // Recycle slot to bottom when it exits top
        if (slot.y < -20) {
          slot.y = tipY;
          const w = plumeWidth(slot.y, height);
          const result = getNextLine(state.currentText, state.cursor, w);
          slot.lineText = result.text;
          state.cursor = result.cursor;
        }

        const t = Math.max(0, Math.min(1, 1 - slot.y / tipY));
        const spinePoint = bezierPoint(p0, cp1, cp2, p3, t);
        const opacity = Math.max(0, slot.y / tipY);

        if (!slot.lineText || opacity <= 0) continue;

        ctx.fillStyle = `rgba(220, 215, 205, ${opacity * 0.85})`;

        // Render character by character with noise perturbation
        const chars = Array.from(slot.lineText);
        const totalW = chars.length * CHAR_SPACING;
        let charX = spinePoint.x - totalW / 2;

        for (let ci = 0; ci < chars.length; ci++) {
          const nx = state.noise2D(ci * 0.3, state.time * 0.0004) * 5;
          const ny = state.noise2D(ci * 0.3 + 100, state.time * 0.0003) * 3;
          ctx.fillText(chars[ci], charX + nx, slot.y + ny);
          charX += CHAR_SPACING;
        }
      }

      state.animFrameId = requestAnimationFrame(frame);
    }

    stateRef.current.animFrameId = requestAnimationFrame(frame);

    return () => {
      if (stateRef.current) cancelAnimationFrame(stateRef.current.animFrameId);
    };
  }, [width, height]); // only re-init on dimension change

  // Live text update — no animation restart
  useEffect(() => {
    if (stateRef.current) {
      stateRef.current.currentText = text;
      stateRef.current.cursor = { segmentIndex: 0, graphemeIndex: 0 };
    }
  }, [text]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded"
      style={{ background: "transparent" }}
    />
  );
}
