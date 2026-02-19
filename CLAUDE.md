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

# Generate static site
npm run generate

# Run tests
npm run test
```

## Architecture Overview

This is a Nuxt.js 2 application built with Vue.js and Vuetify for UI components. The project includes web3 integration for blockchain interactions.

### Key Technologies
- **Framework**: Nuxt.js 2.15.7 (Vue.js)
- **UI Library**: Vuetify 2.5.5 (Material Design components)
- **Blockchain**: Web3.js 1.10.0 for Ethereum interactions
- **Testing**: Jest with Vue Test Utils
- **TypeScript**: Enabled with Nuxt TypeScript build module

### Directory Structure
- `pages/`: Application routes (index.vue, wassies.vue, cigawrote.vue)
- `components/`: Reusable Vue components (Donation.vue, Mint.vue, RahdohtLogo.vue, Search.vue)
- `layouts/`: Page layouts (default.vue, error.vue)
- `contracts/`: Smart contract ABI files (Cigawrote.json)
- `store/`: Vuex store files
- `static/`: Static assets served from root
- `assets/`: Build-time assets

### Smart Contract Integration
The application interacts with an ERC-721 NFT contract called "Cigawrote" with functionality for:
- Minting NFTs with metadata (literature, parent, collection fields)
- Burning tokens
- Pausable contract functionality
- Custom metadata retrieval methods

### Configuration Notes
- Target set to "static" for static site generation
- Dark theme enabled by default in Vuetify
- TypeScript paths configured for `@/*` and `~/*` aliases
- Jest configured for Vue component testing with coverage collection

### Pages Overview
- `/`: Landing page with logo and navigation to Wassies calculator
- `/wassies`: "All Wassies Are Rare Calculator" - appears to be a joke/fun tool
- `/cigawrote`: Related to the NFT contract functionality

The application appears to be a personal project combining NFT/blockchain functionality with utility tools, branded as "rahdoht".