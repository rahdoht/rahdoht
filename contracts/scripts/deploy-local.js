const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy a mock oracle at $2000/ETH
  const MockFeed = await hre.ethers.getContractFactory("MockV3Aggregator");
  const mockFeed = await MockFeed.deploy(8, 200000000000n);
  await mockFeed.waitForDeployment();
  console.log("MockV3Aggregator deployed to:", mockFeed.target);

  const Palimpsest = await hre.ethers.getContractFactory("Palimpsest");
  const palimpsest = await Palimpsest.deploy(mockFeed.target);
  await palimpsest.waitForDeployment();
  console.log("Palimpsest deployed to:", palimpsest.target);

  const price = await palimpsest.packPriceInEth();
  console.log("Mint price:", hre.ethers.formatEther(price), "ETH");
}

main().catch((e) => { console.error(e); process.exit(1); });
