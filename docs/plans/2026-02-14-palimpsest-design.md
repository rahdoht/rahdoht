# Palimpsest: Design Document

## Manifesto

The cigarette pack is one of the most surveilled surfaces in the world. Governments
mandate what text appears, what font, what size, what warnings. It is a site where
state power is literally inscribed onto a consumer object.

Palimpsest reclaims that surface. You write your literature onto a cigarette pack and
mint it as an NFT on Base. The text lives only in the image — opaque to machines,
legible only to human eyes. There is no on-chain text field, no searchable index, no
database. If you want to read a Palimpsest, you have to look at it.

The name comes from the practice of scraping parchment clean and writing over it, with
traces of the original visible beneath. That is literally what happens here: your words
are layered over someone else's pack image. The V1 Cigawrettes collection is the
original manuscript. Your text is the new layer. The parent chain is the stratigraphy.

Each Palimpsest references a parent — another token, a URL, a book, a feeling, anything
in the world. The chain of parentage extends beyond the blockchain into reality. You can
traverse the lineage by following parent references, but at each node you must stop and
look. The machine cannot speed-read the collection for you. This friction is intentional.

It costs a pack of cigarettes to mint. Always. The price is pegged to ~$8.50 USD via
Chainlink oracle, denominated in ETH. The supply is uncapped — you cannot cap a literary
medium. The constraint is intentionality, not scarcity.

Future curation (anthologies, collections) will be a separate contract — a distinct
creative act with its own aura. For now, each Palimpsest is an atomic literary gesture:
text on pack, referent declared, inscribed on-chain.

---

## Architecture Overview

### Tech Stack

- **Frontend**: Nuxt 2 / Vue.js / Vuetify (existing rahdoht app)
- **Smart Contract**: Solidity 0.8.28, Solady ERC721 (Vectorized)
- **Local Dev**: Hardhat (compile, test, local node)
- **Wallet**: ethers.js v6 via MetaMask
- **IPFS Pinning**: Pinata (via serverless proxy)
- **Upload Proxy**: Cloudflare Worker (holds Pinata API key, rate-limited)
- **Price Oracle**: Chainlink ETH/USD feed on Base
- **Network**: Base (Base Sepolia for testnet, Base mainnet for production)

### Monorepo Structure

```
rahdoht/
  contracts/
    src/
      Palimpsest.sol          # Main NFT contract
    test/
      Palimpsest.t.sol        # Contract tests
    scripts/
      deploy.js               # Deployment script
      deploy-local.js         # Local Hardhat deployment
    hardhat.config.js
  worker/
    index.js                  # Cloudflare Worker for Pinata proxy
    wrangler.toml             # Worker config
  components/
    Palimpsest.vue            # Main minting component (replaces Mint.vue)
    PackCanvas.vue            # Canvas rendering component
    WalletConnect.vue         # Wallet connection UI
  pages/
    palimpsest.vue            # Minting page (replaces cigawrote.vue)
  lib/
    putLabel.js               # Canvas text rendering (ported from tmp/frontend/utils.js)
    ipfs.js                   # IPFS upload via worker proxy
    contract.js               # Contract interaction helpers
  ...existing nuxt structure (index.vue, wassies.vue, etc.)
```

---

## Smart Contract: Palimpsest.sol

### Base

Solady `ERC721` from Vectorized. Includes built-in Ownable.

### State

```solidity
mapping(uint256 => string) private _parents;
mapping(uint256 => string) private _tokenURIs;
uint256 private _nextTokenId;
bool public mintPaused;
AggregatorV3Interface internal priceFeed; // Chainlink ETH/USD
uint256 public constant PACK_PRICE_USD = 850; // $8.50 in cents
```

### Mint Function

```solidity
function mint(string calldata parent, string calldata tokenURI) external payable
```

- Reads Chainlink ETH/USD feed to calculate current price in ETH
- Requires `msg.value >= packPriceInEth()`
- Stores `parent` in `_parents` mapping
- Stores `tokenURI` in `_tokenURIs` mapping
- Mints token to `msg.sender`
- Emits standard Transfer event

### Parent Logic

- `parent` parameter is a string — can be anything (IPFS URL, book title, token reference, free text)
- Defaults are handled client-side: if user doesn't override, frontend passes the IPFS URL of the base pack image used
- `getParent(uint256 tokenId) → string` public view function for chain traversal

### Price Oracle

- Chainlink `AggregatorV3Interface` for ETH/USD on Base
- `packPriceInEth()` public view: returns current mint price in wei
- Target: ~$8.50 USD (average pack of cigarettes)
- Handles stale oracle data (revert if answer is stale beyond threshold)

### Admin Functions

- `pauseMint(bool)` — owner only
- `withdraw()` — owner only, sends contract balance to owner
- `setPackPriceUsd(uint256)` — owner only, adjust USD target if pack prices change

### What's NOT in the Contract

- No `literature` field — text lives in the image only
- No `collection` field — future curation contract
- No allowlist / Merkle tree — open minting
- No batch minting — one at a time, each is intentional
- No max supply cap — uncapped literary medium

---

## Minting Flow (User Journey)

### Step 1: Choose a Pack

User arrives at `/palimpsest`. Sees the minting interface. Selects a base pack by
entering an ID number (1-9999). The app fetches the corresponding V1 Cigawrettes
image from IPFS:

```
https://bafybeigvhgkcqqamlukxcmjodalpk2kuy5qzqtx6m4i6pvb7o3ammss3y4.ipfs.dweb.link/{id}.jpg
```

The pack image displays as a live preview.

### Step 2: Write Your Text

User types in the text input field. The `putLabel()` canvas function renders the text
onto the pack image in real-time as they type. Text auto-wraps, font size adjusts
dynamically to fit the label zone. The user sees exactly what their Palimpsest will
look like.

### Step 3: Set the Parent (Optional)

A text field for the parent reference. Pre-filled with the IPFS URL of the selected
base pack. User can override with anything: a URL, a book reference, another token ID,
prose, whatever they want. This is the referent — what this Palimpsest is a response to.

### Step 4: Connect Wallet

User clicks "Connect Wallet". MetaMask prompts for Base network. The app displays:
- Connected wallet address (truncated)
- Current mint price in ETH (fetched from contract's oracle)
- "~ $8.50 (one pack)" label

### Step 5: Mint

User clicks "Mint". The app:
1. Exports the canvas as PNG (data URL → Blob)
2. Uploads PNG to IPFS via Cloudflare Worker proxy
3. Constructs ERC721 metadata JSON:
   ```json
   {
     "name": "Palimpsest #{tokenId}",
     "description": "A palimpsest.",
     "image": "ipfs://{imageCID}",
     "attributes": [
       { "trait_type": "parent", "value": "{parent string}" },
       { "trait_type": "base_pack", "value": "{pack ID}" }
     ]
   }
   ```
4. Uploads metadata JSON to IPFS via worker proxy
5. Calls `contract.mint(parent, metadataURI)` with ETH value
6. Displays transaction status: pending → confirmed → success with token ID

---

## Cloudflare Worker: IPFS Upload Proxy

### Purpose

Holds the Pinata API key server-side. The frontend never sees the secret.

### Endpoints

```
POST /upload
  - Accepts: multipart/form-data (image or JSON)
  - Requires: wallet signature in header (proves wallet ownership)
  - Returns: { cid: "Qm..." }
  - Rate limit: by wallet address, N uploads per hour
```

### Security

- Pinata API key stored in Worker environment variables (Cloudflare secrets)
- Wallet signature verification: user signs a message with their wallet, worker
  verifies the signature before accepting the upload
- Rate limiting by wallet address prevents spam
- Upload size limit (e.g., 5MB max)
- Only accepts image/png and application/json content types

### Migration Path

The worker is a thin proxy. If Pinata is replaced with another pinning service,
only the worker code changes. The contract and frontend are unaffected — they only
deal in CIDs.

---

## Canvas Rendering: putLabel()

### Source

Ported from `tmp/frontend/src/utils.js` (React project). Framework-agnostic — pure
Canvas API.

### How It Works

1. Creates an off-screen canvas (1728x2160px — matches pack image dimensions)
2. Draws the base pack image
3. Formats text: word-wraps to fit a 480px-wide label zone
4. Dynamic font sizing: starts at 43px bold Helvetica, shrinks until text fits
   within the label bounds (480x225px)
5. Applies 2D affine transform for perspective (skew/scale to match pack surface)
6. Draws text line by line with calculated spacing
7. Returns canvas as data URL

### Integration

Wrapped in a Vue component (`PackCanvas.vue`) that watches the text input and
base image reactively. On every keystroke, `putLabel()` re-renders the preview.

---

## Read / Browse View (Future — Separate Session)

Not part of this implementation. Designed for later:

- Query `getParent(tokenId)` to traverse parent chains
- Display pack images from `tokenURI`
- Text is only visible by looking at each image — no text index, no scraping
- Navigation: click a Palimpsest → see its parent → follow the chain
- Future curation contract: a separate NFT that references a set of Palimpsest
  token IDs, creating anthologies as their own creative/curatorial acts

---

## Test Strategy

### Contract Tests (Hardhat + Chai)

- Mint: correct token assignment, parent storage, URI storage
- Price oracle: mock Chainlink feed, verify price calculation
- Price oracle: stale data handling
- Pause: minting blocked when paused
- Permissions: only owner can pause/withdraw/adjust price
- Parent retrieval: `getParent()` returns correct string for each token
- Payment: revert on underpayment, accept exact payment, handle overpayment
- Edge cases: empty parent string, very long parent string, special characters

### Component Tests (Jest + Vue Test Utils)

- putLabel: renders text onto canvas (snapshot or pixel comparison)
- putLabel: handles empty text, very long text, special characters
- Wallet connection state management
- Mint flow state transitions (idle → uploading → minting → confirmed → error)

### Integration Tests (Local Hardhat Node)

- Full end-to-end: render → upload → mint → verify on-chain
- Run local Hardhat node, deploy contract, test in browser
- Verify parent chain traversal across multiple mints

---

## Deployment Plan

### Phase 1: Local Development
1. Write and test Palimpsest.sol against local Hardhat node
2. Port putLabel() and wallet logic to Vue components
3. Build Cloudflare Worker for IPFS proxy
4. Test full flow locally (Hardhat node + Nuxt dev server + Worker dev)

### Phase 2: Testnet
1. Deploy Palimpsest.sol to Base Sepolia
2. Deploy Cloudflare Worker to production
3. Configure Chainlink oracle address for Base Sepolia
4. Test with real MetaMask on testnet
5. Verify IPFS uploads persist and resolve

### Phase 3: Mainnet
1. Deploy Palimpsest.sol to Base mainnet
2. Update contract address in frontend config
3. Configure Chainlink oracle address for Base mainnet
4. Add /palimpsest to navigation drawer
5. Deploy static site

---

## Dependencies to Set Up

### npm packages (add to rahdoht)
- `ethers` (v6) — wallet + contract interaction
- `hardhat` (dev) — contract compilation + testing + local node
- `@nomicfoundation/hardhat-toolbox` (dev) — Hardhat plugins
- `solady` (dev) — Vectorized's Solidity snippets

### Cloudflare
- Cloudflare account (free tier)
- Wrangler CLI for Worker deployment
- Pinata API key stored as Worker secret

### Pinata
- Pinata account (free tier: 100 pins, 500MB)
- API key + secret generated for the Worker

### Chainlink
- No account needed — read-only oracle contract on Base
- ETH/USD feed address on Base Sepolia and Base mainnet

---

## Reference Material

### Existing Code to Port
- `tmp/frontend/src/utils.js` — putLabel() canvas rendering function
- `tmp/frontend/src/App.js` — wallet connection, mint flow, error handling patterns

### Existing Code for Reference Only (not porting)
- `tmp/cignetsysx/` — friend's project, inspiration for features/filters
- `tmp/contracts/Cigawrettes.sol` — V1 contract from etherscan (the original collection)
- `tmp/contracts/Cigawrote.sol` — earlier V2 experiment (different design from Palimpsest)

### V1 Pack Images (IPFS)
- Base URL: `https://bafybeigvhgkcqqamlukxcmjodalpk2kuy5qzqtx6m4i6pvb7o3ammss3y4.ipfs.dweb.link`
- Format: `/{id}.jpg` where id is 1-9999
- Resolution: 1728x2160px
