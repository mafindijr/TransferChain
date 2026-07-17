# @transferchain/sdk

Official TypeScript SDK for the [TransferChain](https://github.com/transferchain) smart contract protocol.

The SDK is the only supported interface between applications and the TransferChain blockchain. Applications never manage blockchain infrastructure directly.

## Features

- **Type-safe** — Full TypeScript coverage for all contracts, events, and errors
- **Framework-agnostic** — Works in Node.js, browsers, and React Native
- **Tree-shakeable** — Import only what you use
- **Multi-chain ready** — Designed for Injective EVM with future chain support
- **Event system** — Typed subscriptions and historical queries
- **Metadata resolution** — IPFS and HTTP with caching
- **Workflow helpers** — Multi-step orchestration for transfers, listings, registrations

## Installation

```bash
pnpm add @transferchain/sdk
```

## Quick Start

```typescript
import { TransferChain } from "@transferchain/sdk";

const tc = new TransferChain({
  chainId: 1439,
  rpcUrl: "https://k8s.testnet.json-rpc.injective.network",
  privateKey: "0x...",
});

// Read on-chain state
const player = await tc.players.getPlayer("0xBEEF...");

// Submit a transaction
const result = await tc.marketplace.createListing({
  seller: "0xBEEF...",
  playerId: 1n,
  clubId: 1n,
  price: 1000n * 10n ** 18n,
  metadataUri: "ipfs://Qm...",
});

// Subscribe to events
const unsubscribe = tc.events.subscribe("ListingCreated", (event) => {
  console.log(`New listing by ${event.seller}`);
});

// Resolve metadata
const profile = await tc.metadata.resolvePlayer("ipfs://Qm...");

// Full transfer workflow
const transfer = await tc.workflows.transfer({
  agreement: { listingId: 1n, buyer: "0x...", seller: "0x...", ... },
  deposit: { token: "0x...", amount: 1000n, payee: "0x..." },
  approver: "0x...",
});
```

## Domain Clients

| Client | Contract | Purpose |
|--------|----------|---------|
| `tc.accessControl` | TransferChainAccessControl | Roles, pause/unpause |
| `tc.config` | TransferChainConfig | Treasury, fees, tokens, emergency mode |
| `tc.players` | PlayerRegistry | Player registration, metadata, status |
| `tc.clubs` | ClubRegistry | Club registration, metadata, status |
| `tc.marketplace` | TransferMarketplace | Listings and offers |
| `tc.agreements` | TransferAgreementManager | Transfer agreements |
| `tc.escrow` | Escrow | ERC-20 escrow deposits |
| `tc.treasury` | Treasury | Protocol treasury |
| `tc.events` | — | Event subscriptions and queries |
| `tc.metadata` | — | Off-chain metadata resolution |
| `tc.workflows` | — | Multi-step workflow orchestration |

## Documentation

- [Architecture](./docs/architecture.md)
- [Configuration](./docs/configuration.md)
- [Public API](./docs/public-api.md)
- [Error Handling](./docs/error-handling.md)
- [Contributing](./docs/contributing.md)

## License

MIT
