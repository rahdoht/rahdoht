import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Donation } from "./Donation";

const coin = {
  name: "eth",
  url: "/eth.png",
  address: "0x7A26f2A0B0bFe00E9c6f5E7Cf1206eEeB40245d0",
};

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

describe("Donation", () => {
  it("renders the coin icon", () => {
    render(<Donation coin={coin} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/eth.png");
    expect(img).toHaveAttribute("alt", "eth");
  });

  it("copies address to clipboard on click", async () => {
    render(<Donation coin={coin} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(coin.address);
  });

  it("shows copied feedback after click", async () => {
    render(<Donation coin={coin} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText(/wallet address copied/i)).toBeInTheDocument();
    });
  });
});
