# Pretext Smoke + putLabel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade `putLabel()` with pretext for precise pack label layout, and add a `SmokeText` canvas component that animates the user's typed text flowing through a bezier smoke plume with simplex-noise character perturbation.

**Architecture:** `lib/smokeGeometry.ts` handles pure bezier/width math (unit-tested). `lib/putLabel.ts` is upgraded to use pretext `layoutWithLines()` for accurate multiline layout. `components/SmokeText.tsx` runs a `requestAnimationFrame` loop, feeding pretext `layoutNextLine()` with variable widths from the smoke geometry, then scatters characters with simplex noise.

**Tech Stack:** `@chenglou/pretext`, `simplex-noise`, Vitest, React 19, canvas API

---

## Context

All work happens in `.worktrees/pretext-smoke` on branch `feature/pretext-smoke`.

Key files:
- `lib/putLabel.ts` — currently does manual word wrap via `ctx.measureText`. Replace with pretext.
- `components/Palimpsest.tsx` — main mint UI, has `text` state to pass to `SmokeText`
- `lib/smokeGeometry.ts` — **create new** — pure bezier math
- `components/SmokeText.tsx` — **create new** — animated canvas component

The label zone inside the pack image is 480×225px at a skewed transform. The existing `ctx.setTransform(1.2, -0.215, -0.02, 1.5, 920, ...)` must be preserved.

Run tests with: `npm test` (Vitest, runs `lib/**`, `components/**`)

---

## Task 1: Verify dependencies installed

**Files:**
- Check: `package.json`

**Step 1: Verify pretext and simplex-noise are in package.json**

```bash
grep -E "pretext|simplex" package.json
```

Expected output includes `@chenglou/pretext` and `simplex-noise`.

**Step 2: If missing, install them**

```bash
npm install @chenglou/pretext simplex-noise
```

**Step 3: Verify TypeScript can see them**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors about missing modules (there may be other pre-existing errors — ignore those).

---

## Task 2: lib/smokeGeometry.ts — bezier + plume math

**Files:**
- Create: `lib/smokeGeometry.ts`
- Create: `lib/smokeGeometry.test.ts`

This is pure arithmetic — no canvas, no DOM. Fully unit-testable.

**Step 1: Write the failing tests**

Create `lib/smokeGeometry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  bezierPoint,
  plumeWidth,
  animateControlPoints,
} from "./smokeGeometry";

describe("bezierPoint", () => {
  it("returns start point at t=0", () => {
    const pt = bezierPoint(
      { x: 0, y: 0 },
      { x: 0, y: 50 },
      { x: 100, y: 50 },
      { x: 100, y: 100 },
      0
    );
    expect(pt.x).toBeCloseTo(0);
    expect(pt.y).toBeCloseTo(0);
  });

  it("returns end point at t=1", () => {
    const pt = bezierPoint(
      { x: 0, y: 0 },
      { x: 0, y: 50 },
      { x: 100, y: 50 },
      { x: 100, y: 100 },
      1
    );
    expect(pt.x).toBeCloseTo(100);
    expect(pt.y).toBeCloseTo(100);
  });

  it("returns midpoint symmetrically for symmetric curve", () => {
    const pt = bezierPoint(
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 0, y: 100 },
      { x: 0, y: 200 },
      0.5
    );
    expect(pt.x).toBeCloseTo(0);
    expect(pt.y).toBeCloseTo(100);
  });
});

describe("plumeWidth", () => {
  it("is narrow near the tip (y close to canvasHeight)", () => {
    const near = plumeWidth(480, 500);
    const far = plumeWidth(100, 500);
    expect(near).toBeLessThan(far);
  });

  it("never goes below 16px", () => {
    expect(plumeWidth(499, 500)).toBeGreaterThanOrEqual(16);
  });

  it("never exceeds 140px", () => {
    expect(plumeWidth(0, 500)).toBeLessThanOrEqual(140);
  });
});

describe("animateControlPoints", () => {
  it("returns two control points", () => {
    const cps = animateControlPoints(500, 400, 0);
    expect(cps).toHaveLength(2);
    expect(typeof cps[0].x).toBe("number");
    expect(typeof cps[0].y).toBe("number");
  });

  it("changes x over time", () => {
    const cp1 = animateControlPoints(500, 400, 0)[0].x;
    const cp2 = animateControlPoints(500, 400, 10000)[0].x;
    expect(cp1).not.toBeCloseTo(cp2, 0);
  });
});
```

**Step 2: Run tests — expect FAIL**

```bash
npm test -- smokeGeometry
```

Expected: `Cannot find module './smokeGeometry'`

**Step 3: Implement lib/smokeGeometry.ts**

```ts
export type Point = { x: number; y: number };

/** Cubic bezier point at parameter t ∈ [0,1] */
export function bezierPoint(
  p0: Point,
  cp1: Point,
  cp2: Point,
  p3: Point,
  t: number
): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * cp1.x + 3 * u * t * t * cp2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * cp1.y + 3 * u * t * t * cp2.y + t * t * t * p3.y,
  };
}

/**
 * Smoke plume width at canvas y-position.
 * Tip is at the bottom (y near canvasHeight), vanishing point at top (y=0).
 * Width is narrow at tip, widens as smoke rises, plateaus near top.
 */
export function plumeWidth(y: number, canvasHeight: number): number {
  const progress = 1 - y / canvasHeight; // 0 at tip, 1 at top
  return 16 + 124 * (1 - Math.exp(-progress * 4));
}

/**
 * Animate bezier control points over time.
 * Returns [cp1, cp2] as x,y coords for a spine from
 * tip=(centerX, canvasHeight) to top=(centerX, 0).
 */
export function animateControlPoints(
  canvasHeight: number,
  centerX: number,
  time: number
): [Point, Point] {
  const cp1: Point = {
    x: centerX + Math.sin(time * 0.00031) * 40,
    y: canvasHeight * 0.65,
  };
  const cp2: Point = {
    x: centerX + Math.sin(time * 0.00019 + 1.5) * 60,
    y: canvasHeight * 0.3,
  };
  return [cp1, cp2];
}
```

**Step 4: Run tests — expect PASS**

```bash
npm test -- smokeGeometry
```

Expected: all tests pass.

**Step 5: Commit**

```bash
git add lib/smokeGeometry.ts lib/smokeGeometry.test.ts
git commit -m "feat: add smokeGeometry — bezier spine + plume width math"
```

---

## Task 3: Upgrade lib/putLabel.ts with pretext

**Files:**
- Modify: `lib/putLabel.ts`

pretext's `prepareWithSegments` uses `canvas.measureText` under the hood, so it requires a browser canvas context. This means unit testing in jsdom is impractical without heavy mocking — verify this change visually in the dev server instead. The existing skew transform must be preserved exactly.

**Step 1: Replace putLabel.ts**

Replace the entire contents of `lib/putLabel.ts` with:

```ts
import { prepareWithSegments, layoutWithLines, layout } from "@chenglou/pretext";

const IMAGE_WIDTH = 1728;
const IMAGE_HEIGHT = 2160;
const TEXT_X = 920;
const TEXT_Y = 1500;
const LABEL_WIDTH = 480;
const LABEL_HEIGHT = 225;
const MAX_FONT_SIZE = 43;
const MIN_FONT_SIZE = 12;
const FONT_FAMILY = "bold %spx helvetica";

function fontString(size: number): string {
  return `bold ${size}px helvetica`;
}

/**
 * Binary-search the largest font size where the text fits within LABEL_HEIGHT.
 * Uses pretext layout() (pure arithmetic after prepare) for the size search,
 * then layoutWithLines() once to get final line data.
 */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string
): { lines: { text: string }[]; fontSize: number; lineHeight: number } {
  let lo = MIN_FONT_SIZE;
  let hi = MAX_FONT_SIZE;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const lineHeight = mid * 1.35;
    const prepared = prepareWithSegments(text, fontString(mid));
    const { height } = layoutWithLines(prepared, LABEL_WIDTH, lineHeight);
    if (height <= LABEL_HEIGHT) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  const fontSize = lo;
  const lineHeight = fontSize * 1.35;
  const prepared = prepareWithSegments(text, fontString(fontSize));
  const { lines } = layoutWithLines(prepared, LABEL_WIDTH, lineHeight);
  return { lines, fontSize, lineHeight };
}

export async function putLabel(imageURL: string, label: string): Promise<string> {
  const image = new Image();
  image.src = imageURL;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(image, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const { lines, fontSize, lineHeight } = fitText(ctx, label);
  const totalHeight = lines.length * lineHeight;
  const deltaY = 95 - totalHeight / 2;

  ctx.setTransform(1.2, -0.215, -0.02, 1.5, TEXT_X, TEXT_Y + deltaY);
  ctx.font = fontString(fontSize);

  let y = 0;
  for (const line of lines) {
    ctx.fillText(line.text, 0, y);
    y += lineHeight;
  }

  return canvas.toDataURL();
}
```

**Step 2: Check TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep putLabel
```

Expected: no errors on putLabel.ts.

**Step 3: Run full test suite — existing tests must still pass**

```bash
npm test
```

Expected: 6 tests pass (smokeGeometry + existing).

**Step 4: Commit**

```bash
git add lib/putLabel.ts
git commit -m "feat: upgrade putLabel to use pretext layoutWithLines"
```

---

## Task 4: components/SmokeText.tsx — static render first

Build the component in stages: static first, then animation, then noise.

**Files:**
- Create: `components/SmokeText.tsx`
- Create: `components/SmokeText.test.tsx`

**Step 1: Write smoke test**

Create `components/SmokeText.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SmokeText } from "./SmokeText";

describe("SmokeText", () => {
  it("renders a canvas element", () => {
    const { container } = render(
      <SmokeText text="hello world" width={300} height={500} />
    );
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("renders without crashing when text is empty", () => {
    expect(() =>
      render(<SmokeText text="" width={300} height={500} />)
    ).not.toThrow();
  });
});
```

**Step 2: Run test — expect FAIL**

```bash
npm test -- SmokeText
```

Expected: `Cannot find module './SmokeText'`

**Step 3: Create components/SmokeText.tsx — static canvas, no animation yet**

```tsx
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
          const t = 1 - slot.y / height;
          const w = plumeWidth(slot.y, height);
          const result = getNextLine(state.currentText, state.cursor, w);
          slot.lineText = result.text;
          state.cursor = result.cursor;
        }

        const t = Math.max(0, Math.min(1, 1 - slot.y / tipY));
        const spinePoint = bezierPoint(p0, cp1, cp2, p3, t);
        const lineWidth = plumeWidth(slot.y, height);
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

    state.animFrameId = requestAnimationFrame(frame);
    stateRef.current!.animFrameId = stateRef.current!.animFrameId;

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
```

**Step 4: Run tests — expect PASS**

```bash
npm test -- SmokeText
```

Expected: 2 tests pass.

**Step 5: Run full suite**

```bash
npm test
```

Expected: all tests pass.

**Step 6: Commit**

```bash
git add components/SmokeText.tsx components/SmokeText.test.tsx
git commit -m "feat: add SmokeText animated smoke canvas component"
```

---

## Task 5: Wire SmokeText into Palimpsest.tsx

**Files:**
- Modify: `components/Palimpsest.tsx`

**Step 1: Read current Palimpsest.tsx to understand layout**

```bash
cat components/Palimpsest.tsx
```

Look for where `<PackCanvas>` is rendered — `SmokeText` goes below it.

**Step 2: Add SmokeText import and render**

Add import at top of `components/Palimpsest.tsx`:

```ts
import { SmokeText } from "./SmokeText";
```

Find the JSX where `<PackCanvas ... />` is rendered. After it, add:

```tsx
<SmokeText text={text} width={320} height={480} />
```

The exact location: below `<PackCanvas>` and its loading state wrapper, inside whatever column/container holds the canvas.

**Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

**Step 4: Commit**

```bash
git add components/Palimpsest.tsx
git commit -m "feat: wire SmokeText into Palimpsest mint page"
```

---

## Task 6: Visual verification in dev server

**Step 1: Start dev server in worktree**

```bash
npm run dev
```

Open `http://localhost:3000/palimpsest` (requires `NEXT_PUBLIC_PALIMPSEST_ENABLED=true` in `.env.local`).

**Check:**
- [ ] Pack canvas still renders text correctly (putLabel upgrade works)
- [ ] Smoke canvas appears below pack preview
- [ ] Text typed in the input flows upward through smoke plume
- [ ] Bezier spine sways slowly over time
- [ ] Characters have noise-driven lateral scatter
- [ ] Text fades toward top of canvas
- [ ] Cigarette illustration visible at bottom
- [ ] Animation loops seamlessly

**Step 2: If anything looks off**, adjust these constants in `SmokeText.tsx`:
- `DRIFT_SPEED` — how fast text rises (currently 0.4 px/frame)
- `CHAR_SPACING` — space between chars in a line (currently 8px)
- `SLOT_COUNT` — number of text rows (currently 25)
- Noise scale `* 5` / `* 3` — scatter magnitude
- Noise time multipliers `0.0004` / `0.0003` — drift speed

---

## Task 7: Finish branch

Use `superpowers:finishing-a-development-branch` to merge or PR.
