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
