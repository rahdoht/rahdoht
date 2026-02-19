const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Palimpsest", function () {
  let palimpsest;
  let owner;
  let minter;
  let mockFeed;

  const ETH_PRICE_USD = 200000000000n; // $2000 with 8 decimals
  const PACK_PRICE_USD = 850n;         // $8.50 in cents

  // expected mint price: 850 * 10^26 / (100 * 200000000000)
  //   = 850 * 10^26 / (2 * 10^13)
  //   = 425 * 10^13 = 4.25 * 10^15 wei = 0.00425 ETH
  const EXPECTED_PRICE = (PACK_PRICE_USD * 10n ** 26n) / (100n * ETH_PRICE_USD);

  beforeEach(async function () {
    [owner, minter] = await ethers.getSigners();

    const MockFeed = await ethers.getContractFactory("MockV3Aggregator");
    mockFeed = await MockFeed.deploy(8, ETH_PRICE_USD);

    const Palimpsest = await ethers.getContractFactory("Palimpsest");
    palimpsest = await Palimpsest.deploy(mockFeed.target);
  });

  describe("mint", function () {
    it("mints token 0 to the caller", async function () {
      await palimpsest.connect(minter).mint("ipfs://parent", "ipfs://meta", { value: EXPECTED_PRICE });
      expect(await palimpsest.ownerOf(0)).to.equal(minter.address);
    });

    it("stores the parent string", async function () {
      await palimpsest.connect(minter).mint("my parent ref", "ipfs://meta", { value: EXPECTED_PRICE });
      expect(await palimpsest.getParent(0)).to.equal("my parent ref");
    });

    it("stores the tokenURI", async function () {
      await palimpsest.connect(minter).mint("parent", "ipfs://QmAbc123", { value: EXPECTED_PRICE });
      expect(await palimpsest.tokenURI(0)).to.equal("ipfs://QmAbc123");
    });

    it("increments token IDs sequentially", async function () {
      await palimpsest.connect(minter).mint("p1", "uri1", { value: EXPECTED_PRICE });
      await palimpsest.connect(minter).mint("p2", "uri2", { value: EXPECTED_PRICE });
      expect(await palimpsest.ownerOf(0)).to.equal(minter.address);
      expect(await palimpsest.ownerOf(1)).to.equal(minter.address);
    });

    it("accepts overpayment", async function () {
      await expect(
        palimpsest.connect(minter).mint("p", "u", { value: EXPECTED_PRICE * 2n })
      ).not.to.be.reverted;
    });

    it("reverts on underpayment", async function () {
      await expect(
        palimpsest.connect(minter).mint("p", "u", { value: EXPECTED_PRICE - 1n })
      ).to.be.revertedWithCustomError(palimpsest, "InsufficientPayment");
    });

    it("handles empty parent string", async function () {
      await palimpsest.connect(minter).mint("", "ipfs://meta", { value: EXPECTED_PRICE });
      expect(await palimpsest.getParent(0)).to.equal("");
    });

    it("handles very long parent string", async function () {
      const longParent = "a".repeat(500);
      await palimpsest.connect(minter).mint(longParent, "ipfs://meta", { value: EXPECTED_PRICE });
      expect(await palimpsest.getParent(0)).to.equal(longParent);
    });
  });

  describe("packPriceInEth", function () {
    it("returns correct price for $2000 ETH", async function () {
      const price = await palimpsest.packPriceInEth();
      expect(price).to.equal(EXPECTED_PRICE);
    });

    it("updates price when ETH price changes", async function () {
      const newEthPrice = 400000000000n; // $4000
      await mockFeed.updateAnswer(newEthPrice);
      const newPrice = await palimpsest.packPriceInEth();
      const expectedNew = (PACK_PRICE_USD * 10n ** 26n) / (100n * newEthPrice);
      expect(newPrice).to.equal(expectedNew);
    });
  });

  describe("pause", function () {
    it("blocks minting when paused", async function () {
      await palimpsest.pauseMint(true);
      await expect(
        palimpsest.connect(minter).mint("p", "u", { value: EXPECTED_PRICE })
      ).to.be.revertedWithCustomError(palimpsest, "MintPaused");
    });

    it("resumes minting when unpaused", async function () {
      await palimpsest.pauseMint(true);
      await palimpsest.pauseMint(false);
      await expect(
        palimpsest.connect(minter).mint("p", "u", { value: EXPECTED_PRICE })
      ).not.to.be.reverted;
    });

    it("only owner can pause", async function () {
      await expect(
        palimpsest.connect(minter).pauseMint(true)
      ).to.be.reverted;
    });
  });

  describe("permissions", function () {
    it("only owner can withdraw", async function () {
      await expect(palimpsest.connect(minter).withdraw()).to.be.reverted;
    });

    it("withdraw sends balance to owner", async function () {
      await palimpsest.connect(minter).mint("p", "u", { value: EXPECTED_PRICE });
      const before = await ethers.provider.getBalance(owner.address);
      const tx = await palimpsest.withdraw();
      const receipt = await tx.wait();
      const gas = receipt.gasUsed * tx.gasPrice;
      const after = await ethers.provider.getBalance(owner.address);
      expect(after).to.be.greaterThan(before - gas);
    });

    it("only owner can set pack price", async function () {
      await expect(palimpsest.connect(minter).setPackPriceUsd(1000n)).to.be.reverted;
    });

    it("owner can update pack price", async function () {
      await palimpsest.setPackPriceUsd(1000n);
      expect(await palimpsest.packPriceUsd()).to.equal(1000n);
    });
  });

  describe("getParent", function () {
    it("returns the parent for each token independently", async function () {
      await palimpsest.connect(minter).mint("parent-A", "uri-A", { value: EXPECTED_PRICE });
      await palimpsest.connect(minter).mint("parent-B", "uri-B", { value: EXPECTED_PRICE });
      expect(await palimpsest.getParent(0)).to.equal("parent-A");
      expect(await palimpsest.getParent(1)).to.equal("parent-B");
    });
  });
});
