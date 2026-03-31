# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests (Vitest)
npm run test
npm run test:watch

# Smart contract deployment
npm run deploy:local      # Deploy to local Hardhat node
npm run deploy:sepolia    # Deploy to Base Sepolia testnet
npm run deploy:mainnet    # Deploy to Base mainnet
```

## Architecture Overview

This is a **Next.js 15 / React 19 / TypeScript** application. The project has been fully migrated from Nuxt 2/Vue — ignore any remaining `.vue` files or `.nuxt/` artifacts, they are dead code.

### Key Technologies
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS (dark theme, neutral palette, monospace font)
- **Blockchain**: wagmi v2 + viem (Base network + Base Sepolia + local Hardhat)
- **Smart Contracts**: Hardhat + Solidity 0.8.28, Solady ERC721
- **Testing**: Vitest + jsdom
- **IPFS**: Pinata via Next.js API route (`/api/upload`)

### Directory Structure
- `app/` — Next.js App Router pages and API routes
  - `page.tsx` — Home (logo + navigation)
  - `wassies/page.tsx` — "All Wassies Are Rare" calculator
  - `palimpsest/page.tsx` — Palimpsest NFT minting (feature-flagged)
  - `api/upload/route.ts` — Pinata IPFS proxy (server-side)
  - `providers.tsx` — wagmi + React Query providers
  - `layout.tsx` — Root layout
- `components/` — React TSX components
  - `Palimpsest.tsx` — Main minting UI
  - `PackCanvas.tsx` — Canvas rendering for cigarette pack images
  - `WalletConnect.tsx` — Custom wallet connect button (no RainbowKit)
  - `Nav.tsx` — Sidebar navigation
  - `RahdohtLogo.tsx` — Animated logo
  - `WassieSearch.tsx` — Wassie calculator UI
  - `Donation.tsx` — Donation component
- `lib/` — Utilities and Web3 helpers
  - `putLabel.ts` — Canvas text rendering (overlays text onto pack image)
  - `ipfs.ts` — IPFS upload helpers
  - `wagmi.ts` — wagmi config (Base, Base Sepolia, Hardhat)
  - `contract.ts` — wagmi hooks for Palimpsest contract
  - `PalimpsestABI.json` — Contract ABI
- `contracts/` — Hardhat project
  - `src/Palimpsest.sol` — NFT contract (Solady ERC721, Chainlink oracle)
  - `src/MockV3Aggregator.sol` — Mock oracle for local testing
  - `test/Palimpsest.test.js` — Contract tests
  - `scripts/deploy.js` — Deploy to Base networks
  - `scripts/deploy-local.js` — Local Hardhat deployment
- `public/` — Static assets
- `docs/plans/` — Implementation plan documents
- `tmp/` — Reference code only, NOT part of the app

### Smart Contract: Palimpsest
An ERC-721 NFT on Base where users write text onto cigarette pack images and mint. Text lives only in the image (no on-chain text field — intentional philosophical choice).

Key contract features:
- **Solady ERC721** (Vectorized) — NOT ERC721A
- Price pegged to cost of a pack of cigarettes (~$8.50 USD) via **Chainlink ETH/USD oracle**
- Stores `parent` (string reference to anything) and `tokenURI` (IPFS metadata)
- Admin: `pauseMint()`, `withdraw()`, `setPackPriceUsd()`
- Chainlink oracle addresses:
  - Base Sepolia: `0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1`
  - Base Mainnet: `0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70`

### Palimpsest Mint Flow
1. User selects pack ID (1–9999) and enters text + parent field
2. `putLabel()` renders text onto 1728×2160 cigarette pack image via canvas
3. On mint: image → `/api/upload` → Pinata → IPFS CID
4. Metadata JSON → `/api/upload` → Pinata → IPFS CID
5. `mint(parent, tokenURI)` contract call with ETH value from oracle price

### Environment Variables
```
NEXT_PUBLIC_PALIMPSEST_ENABLED=true         # Feature flag for /palimpsest route
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...          # Deployed Palimpsest contract address
PINATA_API_KEY=                             # Pinata API key (server-side only)
PINATA_SECRET_API_KEY=                      # Pinata secret (server-side only)
BASE_SEPOLIA_RPC_URL=                       # Optional, defaults to public RPC
BASE_RPC_URL=                               # Optional, defaults to public RPC
DEPLOYER_PRIVATE_KEY=                       # For contract deployment
```

### Configuration Notes
- `hardhat.config.js` uses CJS — plan to migrate to `.mjs` (ESM)
- TypeScript path alias: `@/*` → project root
- Vitest configured for `lib/**`, `components/**`, `app/**` (excludes `tmp/`, `contracts/`)
- Next.js configured to allow IPFS images from `*.ipfs.dweb.link` and `arweave.net`
- V1 pack images base URL: `https://bafybeigvhgkcqqamlukxcmjodalpk2kuy5qzqtx6m4i6pvb7o3ammss3y4.ipfs.dweb.link/{id}.jpg`

### Dead Code (ignore, not yet removed)
- `components/*.vue` — old Vue components
- `.nuxt/` — old Nuxt build output
- `store/` — old Vuex store directory
- `assets/`, `static/` — old Nuxt asset directories
