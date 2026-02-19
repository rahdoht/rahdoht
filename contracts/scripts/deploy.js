const hre = require("hardhat");

// Chainlink ETH/USD addresses:
const ORACLE = {
  "base-sepolia": "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1",
  base: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
};

async function main() {
  const network = hre.network.name;
  const oracleAddress = process.env.ORACLE_ADDRESS ?? ORACLE[network];

  if (!oracleAddress) {
    throw new Error(`No oracle address for network: ${network}`);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Network:", network);
  console.log("Deploying with:", deployer.address);
  console.log("Oracle:", oracleAddress);

  const Palimpsest = await hre.ethers.getContractFactory("Palimpsest");
  const palimpsest = await Palimpsest.deploy(oracleAddress);
  await palimpsest.waitForDeployment();

  console.log("Palimpsest deployed to:", palimpsest.target);
  console.log("→ Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
}

main().catch((e) => { console.error(e); process.exit(1); });
