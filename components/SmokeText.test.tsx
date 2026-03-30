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
