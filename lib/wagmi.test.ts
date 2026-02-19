import { describe, it, expect } from "vitest";
import { config } from "./wagmi";
import { base, baseSepolia } from "wagmi/chains";

describe("wagmi config", () => {
  it("includes base, base sepolia, and hardhat chains", () => {
    const chainIds = config.chains.map((c) => c.id);
    expect(chainIds).toContain(base.id);
    expect(chainIds).toContain(baseSepolia.id);
    // hardhat chain id is 31337
    expect(chainIds).toContain(31337);
  });

  it("has at least one connector configured", () => {
    expect(config.connectors.length).toBeGreaterThan(0);
  });
});
