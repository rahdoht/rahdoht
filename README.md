# rahdoht

Personal project combining NFT/blockchain functionality with utility tools.

## Setup

```bash
npm install
npm run dev       # localhost:3000
npm run build
npm run start
npm run test
```

## Pages

- `/` — landing page
- `/wassies` — All Wassies Are Rare Calculator
- `/palimpsest` — Palimpsest NFT minting (requires `NEXT_PUBLIC_PALIMPSEST_ENABLED=true`)

## Environment

Copy `.env.local.example` to `.env.local` (or create it) with:

```
NEXT_PUBLIC_PALIMPSEST_ENABLED=true
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
PINATA_API_KEY=
PINATA_SECRET_API_KEY=
```

## Stack

Next.js 15 / React 19 / TypeScript / Tailwind CSS / wagmi v2 / Hardhat
