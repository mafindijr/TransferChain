# @transferchain/sdk

Official TypeScript SDK for the [TransferChain](https://github.com/transferchain) smart contract protocol.

The SDK is the only supported interface between applications and the TransferChain blockchain. Applications never manage blockchain infrastructure directly.

## Features

- **Type-safe** — Full TypeScript coverage for all contracts, events, and errors
- **Framework-agnostic** — Works in Node.js, browsers, and React Native
- **Tree-shakeable** — Import only what you use
- **Multi-chain ready** — Designed for Injective EVM with future chain support

## Installation

```bash
pnpm add @transferchain/sdk
```

## Quick Start

```typescript
import { TransferChain } from "@transferchain/sdk";

const tc = new TransferChain({
  chainId: 8888,
  rpcUrl: "https://evm.injective.network",
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
```

## Documentation

- [Architecture](./docs/architecture.md)
- [Configuration](./docs/configuration.md)
- [Public API](./docs/public-api.md)
- [Error Handling](./docs/error-handling.md)
- [Contributing](./docs/contributing.md)

## License

MIT
