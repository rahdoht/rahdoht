import { describe, it, expect, vi, beforeEach } from "vitest";
import { putLabel } from "./putLabel";

// Mock canvas in jsdom
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
    measureText: vi.fn(() => ({
      width: 100,
      fontBoundingBoxAscent: 14,
      fontBoundingBoxDescent: 4,
    })),
    fillText: vi.fn(),
    setTransform: vi.fn(),
    translate: vi.fn(),
    textAlign: "",
    textBaseline: "",
    font: "",
  } as unknown as CanvasRenderingContext2D);

  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,abc123"
  );
});

describe("putLabel", () => {
  it("returns a data URL", async () => {
    // Mock Image load
    const img = { crossOrigin: "", src: "", onload: null as (() => void) | null };
    vi.spyOn(globalThis, "Image" as never).mockImplementation(() => img as unknown as HTMLImageElement);

    const promise = putLabel("https://example.com/pack.jpg", "hello world");
    // Trigger onload
    img.onload?.();
    const result = await promise;
    expect(result).toMatch(/^data:image/);
  });
});
