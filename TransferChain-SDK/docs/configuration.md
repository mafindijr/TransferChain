# Configuration

## Table of Contents

- [SDK Initialization](#sdk-initialization)
- [Configuration Interface](#configuration-interface)
- [Deferred Validation](#deferred-validation)
- [Immutable After Construction](#immutable-after-construction)
- [Deployment Manifest](#deployment-manifest)
- [Address Resolution](#address-resolution)
- [Environment Variables](#environment-variables)
- [Transaction Defaults](#transaction-defaults)
- [Metadata Configuration](#metadata-configuration)

---

## SDK Initialization

The `TransferChain` class accepts a configuration object at construction time.

```typescript
import { TransferChain } from "@transferchain/sdk";

const tc = new TransferChain({
  chainId: 8888,
  rpcUrl: "https://evm.injective.network",
  privateKey: "0x...",
});
```

The SDK operates in read-only mode if no signer is provided:

```typescript
const tc = new TransferChain({
  chainId: 8888,
  rpcUrl: "https://evm.injective.network",
  // No privateKey or signer — read-only mode
});
```

---

## Configuration Interface

```typescript
interface SdkConfig {
  /** Chain ID (required) */
  chainId: number;

  /** JSON-RPC endpoint URL (required unless provider is provided) */
  rpcUrl: string;

  /** Private key for signing transactions (optional — read-only if omitted) */
  privateKey?: string;

  /** Pre-built ethers.js Signer instance (optional — overrides privateKey) */
  signer?: ethers.Signer;

  /** Pre-built ethers.js Provider instance (optional — overrides rpcUrl) */
  provider?: ethers.Provider;

  /** Contract addresses per chain (optional — falls back to built-in manifest) */
  deployment?: DeploymentManifest;

  /** Logger implementation (optional — silent by default) */
  logger?: Logger;

  /** Middleware for the transaction pipeline (optional) */
  middleware?: Middleware[];

  /** Plugins to extend SDK functionality (optional) */
  plugins?: Plugin[];

  /** Metadata resolution configuration (optional) */
  metadata?: MetadataConfig;

  /** Default transaction parameters (optional) */
  transactions?: TransactionDefaults;
}
```

---

## Deferred Validation

Configuration is validated lazily. The constructor does not make RPC calls or validate addresses. Validation happens on first use:

- **Provider connectivity** is verified on the first read call
- **Signer validity** is verified on the first write call
- **Address checksums** are validated when the deployment manifest is first accessed

This keeps initialization fast and synchronous.

---

## Immutable After Construction

The `TransferChain` instance is effectively immutable after construction. Provider, signer, and contract references cannot be changed. To switch chains or signers, create a new instance.

This is a deliberate design choice that eliminates state-management bugs.

---

## Deployment Manifest

The SDK does not hardcode contract addresses. A `DeploymentManifest` maps chain IDs to deployed addresses:

```typescript
interface ChainDeployment {
  transferChainAccessControl: string;
  transferChainConfig: string;
  playerRegistry: string;
  clubRegistry: string;
  transferMarketplace: string;
  transferAgreementManager: string;
  escrow: string;
  treasury: string;
}

type DeploymentManifest = Record<number, ChainDeployment>;
```

### Built-In Manifest

The SDK ships with a built-in manifest for known deployments:

| Chain | Chain ID | Status |
|-------|----------|--------|
| Injective EVM Testnet | 8888 | Supported |
| Injective EVM Mainnet | 525 | Planned |

### Custom Manifest

Override or extend the built-in manifest via the `deployment` config option:

```typescript
const tc = new TransferChain({
  chainId: 31337,
  rpcUrl: "http://localhost:8545",
  deployment: {
    31337: {
      transferChainAccessControl: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      transferChainConfig: "0xe7f1725E7734CE288D8487fA04914703BF038940",
      playerRegistry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      clubRegistry: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB8aC9",
      transferMarketplace: "0xDc64Aa14a006F33526Ea98471305d3C9aEE6e1b7",
      transferAgreementManager: "0x5FC8d32690cc91D4c39d99302695952D75708050",
      escrow: "0x0165878A399126580D14De7532058f3796F93751",
      treasury: "0xa513E6E4b8f2a923D98E0c1c2a23A231B3fc443E",
    },
  },
});
```

---

## Address Resolution

When a domain client needs a contract address, it calls the `ContractRegistry` which resolves addresses in this order:

1. User-provided deployment manifest (from `SdkConfig.deployment`)
2. Built-in deployment manifest (shipped with the SDK)

If neither contains an address for the requested chain, a `ValidationError` is thrown with code `CHAIN_NOT_SUPPORTED`.

---

## Environment Variables

Environment variables are a development convenience only. They are never read in production builds.

| Environment Variable | Maps To | Description |
|---------------------|---------|-------------|
| `TRANSFERCHAIN_CHAIN_ID` | `config.chainId` | Target chain ID |
| `TRANSFERCHAIN_RPC_URL` | `config.rpcUrl` | RPC endpoint URL |
| `TRANSFERCHAIN_PRIVATE_KEY` | `config.privateKey` | Signer private key |

Use the optional `fromEnv()` helper to load configuration from environment variables:

```typescript
import { TransferChain, fromEnv } from "@transferchain/sdk";

const config = fromEnv();
const tc = new TransferChain(config);
```

> **Warning:** Never commit private keys to version control. Environment variables are for local development only.

---

## Transaction Defaults

Configure default parameters for all transactions:

```typescript
interface TransactionDefaults {
  /** Number of confirmations to wait (default: 1) */
  confirmations?: number;

  /** Timeout in milliseconds for transaction confirmation (default: 120000) */
  timeout?: number;

  /** Buffer percentage added to gas estimates (default: 20%) */
  gasBuffer?: bigint;

  /** Override maxFeePerGas for all transactions */
  maxFeePerGas?: bigint;

  /** Override maxPriorityFeePerGas for all transactions */
  maxPriorityFeePerGas?: bigint;
}
```

---

## Metadata Configuration

Configure metadata resolution behavior:

```typescript
interface MetadataConfig {
  /** Custom protocol handlers (built-in: IPFS, HTTP) */
  protocols?: ProtocolHandler[];

  /** IPFS gateway URL (default: https://ipfs.io/ipfs/) */
  ipfsGateway?: string;

  /** Metadata cache time-to-live in milliseconds (default: 300000 = 5 minutes) */
  cacheTtl?: number;

  /** Maximum cache entries (default: 1000) */
  cacheMaxSize?: number;
}
```
