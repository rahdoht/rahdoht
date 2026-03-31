export type Point = { x: number; y: number };

/** Cubic bezier tangent vector at parameter t ∈ [0,1] (not normalized) */
export function bezierTangent(
  p0: Point,
  cp1: Point,
  cp2: Point,
  p3: Point,
  t: number
): Point {
  const u = 1 - t;
  return {
    x: 3 * u * u * (cp1.x - p0.x) + 6 * u * t * (cp2.x - cp1.x) + 3 * t * t * (p3.x - cp2.x),
    y: 3 * u * u * (cp1.y - p0.y) + 6 * u * t * (cp2.y - cp1.y) + 3 * t * t * (p3.y - cp2.y),
  };
}

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
