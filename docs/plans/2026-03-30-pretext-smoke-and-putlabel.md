# Pretext Integration: SmokeText Animation + putLabel Upgrade

## Overview

Two improvements sharing one dependency (`@chenglou/pretext`) and one data source (the user's pack text input):

1. **`putLabel()` upgrade** — precise multiline layout within the pack label zone
2. **`SmokeText` component** — live animated smoke column on the mint page driven by the user's typed text

---

## Data Flow

```
<textarea> text
    ├─→ putLabel() → PackCanvas (static pack preview)
    └─→ SmokeText  (live animated smoke, loops forever)
```

The two pieces are independent. The only coupling is the shared text string.

---

## Part 1: putLabel() Upgrade

**Current state:** raw `ctx.fillText` with manual line breaking — no bidi, no emoji, fragile wrapping.

**Upgrade:** replace with `layoutWithLines()` from pretext.

- `prepareWithSegments(text, font)` once per text change
- `layoutWithLines(prepared, zoneWidth, lineHeight)` to get exact line positions
- Binary-search font size to fill the label zone without overflow (use `walkLineRanges` to check line count at each candidate size)
- Proper bidi, emoji, CJK, mixed-script support inherited from pretext

**Files touched:** `lib/putLabel.ts` only.

---

## Part 2: SmokeText Component

### Concept

A `<canvas>` element showing the user's text flowing upward through a smoke plume silhouette. Text cycles continuously — when lines scroll off the top they re-enter at the bottom. Updates live as the user types; no reset, new layout bleeds in naturally as slots cycle.

### Plume Geometry

The smoke column's spine is a **cubic bezier** from a fixed tip (cigarette ember, bottom-center) to a fixed vanishing point (top-center). Two control points drift slowly over time on independent oscillation periods, creating a lazy curling arc.

```
tip (fixed, bottom) → CP1 (slow drift) → CP2 (slower drift) → vanishing point (fixed, top)
```

Each line slot samples `t ∈ [0,1]` along this bezier to get its `centerX`. Column width widens with `y`:

```
width(y) = 20 + 100 * (1 - e^(-y / 200))
```

This gives the narrow-at-tip, opens-up-as-it-rises smoke silhouette. `centerX` and `maxWidth` are passed to `layoutNextLine()` per slot.

### Text Layout (pretext)

- `prepareWithSegments(text, font)` — runs once per text change, result stored in a `useRef`
- `layoutNextLine(prepared, cursor, maxWidth)` — called as each slot recycles to the bottom, with the current bezier width at that `y`. Advances a cursor through the full text; wraps back to start when exhausted.
- Zero measurement cost during the animation loop — pretext's layout is pure arithmetic after `prepare`.

### Per-Character Perturbation (simplex-noise)

After getting each line's text from pretext, characters are rendered individually with noise-driven displacement:

```
dx = noise2D(charIndex * 0.3,  time * 0.0004) * 4   // lateral scatter
dy = noise2D(charIndex * 0.3 + 100, time * 0.0003) * 2  // vertical stagger
```

Adjacent characters move coherently (low spatial frequency) — reads as organic drift, not vibration.

Opacity is a clean linear fade with `y` (no noise), so text dissolves smoothly at the top.

### Animation Loop

```
rAF loop each frame:
  clear canvas
  advance y for each slot by drift speed
  for any slot that exits the top:
    wrap to bottom y
    assign next pretext line (advance cursor, wrap at end)
  recompute bezier spine (control points drift with time)
  for each slot:
    sample bezier at slot.t → centerX
    for each char in slot.line.text:
      dx, dy = noise(charIndex, time)
      opacity = 1 - (slot.y / canvasHeight)
      ctx.fillText(char, x + dx, slot.y + dy) at opacity
  requestAnimationFrame(self)
```

Slot pool size: ~25 slots. Fixed allocation, no GC pressure in the loop.

### Cigarette Illustration

A small static element at the bottom of the canvas — drawn with canvas primitives (no image asset needed):
- White cylinder body
- Orange/amber filter end
- Glowing ember tip (radial gradient)
- The bezier spine anchors its tip to the ember point

### Component Interface

```tsx
<SmokeText text={userText} width={canvasWidth} height={canvasHeight} />
```

`text` is the only dynamic prop. Width/height are fixed at mount.

### Files

- `components/SmokeText.tsx` — new component
- `lib/smokeGeometry.ts` — bezier sampling, width function (pure math, testable)
- `npm install @chenglou/pretext simplex-noise`

---

## Implementation Sequence

1. Install deps: `@chenglou/pretext`, `simplex-noise`
2. Upgrade `lib/putLabel.ts` (self-contained, testable immediately)
3. Build `lib/smokeGeometry.ts` — bezier + width function, unit test
4. Build `SmokeText.tsx` — static first (no animation), then add rAF loop, then noise
5. Wire into mint page alongside existing `PackCanvas`

---

## Dependencies

| Package | Size | Purpose |
|---|---|---|
| `@chenglou/pretext` | ~15kb | text measurement + layout |
| `simplex-noise` | ~2kb | per-character perturbation |
