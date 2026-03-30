"use client";

import { useRef, useEffect } from "react";
import {
  prepareWithSegments,
  layoutNextLine,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";
import { createNoise2D } from "simplex-noise";
import { bezierPoint, bezierTangent, plumeWidth, animateControlPoints } from "@/lib/smokeGeometry";

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

interface State {
  slots: Slot[];
  cursor: LayoutCursor;
  preparedText: PreparedTextWithSegments | null;
  noise2D: (x: number, y: number) => number;
  animFrameId: number;
  time: number;
  currentText: string;
}

function drawCigarette(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#f0f0e8";
  ctx.fillRect(x - 30, y - 4, 44, 8);

  ctx.fillStyle = "#c8824a";
  ctx.fillRect(x + 14, y - 4, 10, 8);

  const glow = ctx.createRadialGradient(x - 30, y, 0, x - 30, y, 8);
  glow.addColorStop(0, "rgba(255, 140, 20, 0.9)");
  glow.addColorStop(0.4, "rgba(255, 60, 0, 0.5)");
  glow.addColorStop(1, "rgba(255, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x - 30, y, 8, 0, Math.PI * 2);
  ctx.fill();
}

// pretext uses canvas.measureText internally — guard for jsdom test environments
function safePrepare(text: string): PreparedTextWithSegments | null {
  if (!text.trim()) return null;
  try {
    return prepareWithSegments(text, FONT);
  } catch {
    return null;
  }
}

function getNextLine(
  state: State,
  cursor: LayoutCursor,
  maxWidth: number
): { text: string; cursor: LayoutCursor } {
  if (!state.preparedText) return { text: "", cursor };
  try {
    const line = layoutNextLine(state.preparedText, cursor, Math.max(maxWidth, 10));
    if (line === null) {
      // Exhausted — restart from beginning
      const fresh: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
      const first = layoutNextLine(state.preparedText, fresh, Math.max(maxWidth, 10));
      if (!first) return { text: state.currentText.slice(0, 20), cursor: fresh };
      return { text: first.text, cursor: first.end };
    }
    return { text: line.text, cursor: line.end };
  } catch {
    return { text: state.currentText.slice(0, 20), cursor };
  }
}

export function SmokeText({ text, width, height }: SmokeTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State | null>(null);

  const tipX = width / 2;
  const tipY = height - 30;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const noise2D = createNoise2D();

    const slots: Slot[] = Array.from({ length: SLOT_COUNT }, (_, i) => ({
      y: tipY - i * (height / SLOT_COUNT),
      lineText: "",
    }));

    stateRef.current = {
      slots,
      cursor: { segmentIndex: 0, graphemeIndex: 0 },
      preparedText: safePrepare(text),
      noise2D,
      animFrameId: 0,
      time: 0,
      currentText: text,
    };

    function frame() {
      const state = stateRef.current!;
      state.time += 16;
      ctx.clearRect(0, 0, width, height);

      const [cp1, cp2] = animateControlPoints(height, tipX, state.time);
      const p0 = { x: tipX, y: tipY };
      const p3 = { x: tipX, y: 0 };

      drawCigarette(ctx, tipX, tipY);

      ctx.font = FONT;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      for (const slot of state.slots) {
        slot.y -= DRIFT_SPEED;

        if (slot.y < -20) {
          slot.y = tipY;
          const w = plumeWidth(slot.y, height);
          const result = getNextLine(state, state.cursor, w);
          slot.lineText = result.text;
          state.cursor = result.cursor;
        }

        const t = Math.max(0, Math.min(1, 1 - slot.y / tipY));
        const spinePoint = bezierPoint(p0, cp1, cp2, p3, t);
        const tangent = bezierTangent(p0, cp1, cp2, p3, t);
        // +PI/2 converts "direction of travel" (upward ≈ -PI/2) to text reading angle (0 = horizontal)
        const angle = Math.atan2(tangent.y, tangent.x) + Math.PI / 2;
        const opacity = Math.max(0, slot.y / tipY);

        if (!slot.lineText || opacity <= 0) continue;

        ctx.fillStyle = `rgba(220, 215, 205, ${opacity * 0.85})`;

        const chars = Array.from(slot.lineText);
        const totalW = chars.length * CHAR_SPACING;

        ctx.save();
        ctx.translate(spinePoint.x, spinePoint.y);
        ctx.rotate(angle);

        let charX = -totalW / 2;
        for (let ci = 0; ci < chars.length; ci++) {
          // noise x = along-curve scatter, noise y = away-from-curve drift
          const nx = state.noise2D(ci * 0.3, state.time * 0.0004) * 5;
          const ny = state.noise2D(ci * 0.3 + 100, state.time * 0.0003) * 3;
          ctx.fillText(chars[ci], charX + nx, ny);
          charX += CHAR_SPACING;
        }

        ctx.restore();
      }

      state.animFrameId = requestAnimationFrame(frame);
    }

    stateRef.current.animFrameId = requestAnimationFrame(frame);

    return () => {
      if (stateRef.current) cancelAnimationFrame(stateRef.current.animFrameId);
    };
  }, [width, height]);

  // Live text update — re-prepare once, no animation restart
  useEffect(() => {
    if (stateRef.current) {
      stateRef.current.currentText = text;
      stateRef.current.cursor = { segmentIndex: 0, graphemeIndex: 0 };
      stateRef.current.preparedText = safePrepare(text);
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
