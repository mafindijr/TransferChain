# Repository Structure

## Table of Contents

- [Directory Tree](#directory-tree)
- [Folder Responsibilities](#folder-responsibilities)
- [ABI Generation](#abi-generation)
- [Naming Conventions](#naming-conventions)
- [Import Conventions](#import-conventions)

---

## Directory Tree

```text
TransferChain-SDK/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── eslint.config.js
├── .prettierrc
├── .gitignore
├── .npmignore
├── ARCHITECTURE.md
├── README.md
├── CHANGELOG.md
│
├── abi/                                  # Generated from Foundry build
│   ├── TransferChainAccessControl.json
│   ├── TransferChainConfig.json
│   ├── PlayerRegistry.json
│   ├── ClubRegistry.json
│   ├── TransferMarketplace.json
│   ├── TransferAgreementManager.json
│   ├── Escrow.json
│   └── Treasury.json
│
├── scripts/
│   └── sync-abis.ts                     # Extracts ABIs from Contracts/out
│
├── src/
│   ├── index.ts                         # Public API barrel export
│   │
│   ├── core/
│   │   ├── TransferChain.ts             # Main SDK entry point (facade)
│   │   ├── types.ts                     # Internal core types
│   │   ├── ProviderManager.ts           # Provider lifecycle + caching
│   │   ├── SignerManager.ts             # Wallet/signer lifecycle
│   │   ├── ContractRegistry.ts          # Lazy contract instantiation + caching
│   │   └── TransactionManager.ts        # TX lifecycle: estimate → send → confirm
│   │
│   ├── types/
│   │   ├── index.ts                     # All public type exports
│   │   ├── enums.ts                     # Protocol enums
│   │   ├── structs.ts                   # Protocol structs
│   │   ├── events.ts                    # Typed event maps
│   │   ├── config.ts                    # SDK configuration types
│   │   └── deployment.ts                # Deployment manifest types
│   │
│   ├── constants/
│   │   ├── index.ts                     # All constant exports
│   │   ├── roles.ts                     # bytes32 role hashes
│   │   └── chains.ts                    # Chain metadata (Injective, etc.)
│   │
│   ├── contracts/
│   │   ├── index.ts                     # All contract client exports
│   │   ├── AccessControlClient.ts
│   │   ├── ConfigClient.ts
│   │   ├── PlayerRegistryClient.ts
│   │   ├── ClubRegistryClient.ts
│   │   ├── MarketplaceClient.ts
│   │   ├── AgreementClient.ts
│   │   ├── EscrowClient.ts
│   │   └── TreasuryClient.ts
│   │
│   ├── events/
│   │   ├── EventManager.ts              # Subscription engine
│   │   ├── EventDecoder.ts              # Log → typed event
│   │   └── EventQueryBuilder.ts         # Historical event queries
│   │
│   ├── metadata/
│   │   ├── MetadataResolver.ts          # URI protocol handler registry
│   │   ├── protocols/
│   │   │   ├── IpfsProtocol.ts          # ipfs:// resolution
│   │   │   ├── HttpProtocol.ts          # https:// resolution
│   │   │   └── types.ts                 # Protocol handler interface
│   │   ├── PlayerMetadata.ts            # Player profile type + fetcher
│   │   └── ClubMetadata.ts              # Club profile type + fetcher
│   │
│   ├── errors/
│   │   ├── TransferChainError.ts        # Base error class
│   │   ├── ContractError.ts             # On-chain revert normalization
│   │   ├── ProviderError.ts             # RPC/network errors
│   │   ├── ValidationError.ts           # Input validation errors
│   │   ├── TransactionError.ts          # TX submission errors
│   │   └── normalize.ts                 # Raw error → SDK error mapper
│   │
│   ├── logger/
│   │   └── Logger.ts                    # Pluggable logger interface + default
│   │
│   ├── middleware/
│   │   ├── Middleware.ts                # Middleware type definitions
│   │   ├── GasEstimationMiddleware.ts   # Custom gas estimation
│   │   └── LoggingMiddleware.ts         # Request/response logging
│   │
│   ├── plugins/
│   │   ├── Plugin.ts                    # Plugin interface
│   │   └── PluginManager.ts            # Plugin lifecycle management
│   │
│   ├── workflows/
│   │   ├── TransferWorkflow.ts          # End-to-end transfer flow
│   │   ├── ListingWorkflow.ts           # Listing lifecycle
│   │   └── RegistrationWorkflow.ts      # Player/club onboarding
│   │
│   └── utils/
│       ├── format.ts                    # BigInt formatting, bps helpers
│       ├── validation.ts               # Address, amount validators
│       └── hash.ts                      # Event topic hashing
│
└── tests/
    ├── setup.ts                         # Global test setup (Anvil, etc.)
    ├── helpers/
    │   ├── anvil.ts                     # Anvil process manager
    │   ├── wallets.ts                   # Test wallet fixtures
    │   ├── deploy.ts                    # Deploy all contracts to Anvil
    │   └── mock-provider.ts             # Mock provider for unit tests
    ├── unit/
    │   ├── core/
    │   ├── contracts/
    │   ├── events/
    │   ├── metadata/
    │   ├── errors/
    │   └── utils/
    └── integration/
        ├── FullProtocolFlow.test.ts
        └── TransferWorkflow.test.ts
```

---

## Folder Responsibilities

| Folder | Purpose | Key Files |
|--------|---------|-----------|
| `abi/` | Generated ABI JSON files from Foundry build output. Never hand-edited. | 8 contract ABIs |
| `scripts/` | Build-time scripts for ABI extraction and tooling. | `sync-abis.ts` |
| `src/core/` | Infrastructure layer: SDK entry point, provider/signer management, contract registry, transaction pipeline. | `TransferChain.ts`, `ProviderManager.ts`, `ContractRegistry.ts`, `TransactionManager.ts` |
| `src/types/` | All public type definitions: enums, structs, events, configuration, deployment. | `enums.ts`, `structs.ts`, `events.ts`, `config.ts`, `deployment.ts` |
| `src/constants/` | Protocol constants: role hashes, chain metadata. | `roles.ts`, `chains.ts` |
| `src/contracts/` | One client class per smart contract. Thin wrappers that validate inputs and return typed results. | `AccessControlClient.ts`, `ConfigClient.ts`, etc. |
| `src/events/` | Event system: subscription engine, log decoder, historical query builder. | `EventManager.ts`, `EventDecoder.ts`, `EventQueryBuilder.ts` |
| `src/metadata/` | Off-chain metadata resolution with pluggable protocol handlers. | `MetadataResolver.ts`, `PlayerMetadata.ts`, `ClubMetadata.ts` |
| `src/errors/` | SDK error hierarchy and error normalization from raw ethers.js errors. | `TransferChainError.ts`, `normalize.ts` |
| `src/logger/` | Pluggable logger interface with silent default. | `Logger.ts` |
| `src/middleware/` | Transaction pipeline middleware: gas estimation, logging, custom hooks. | `Middleware.ts`, `GasEstimationMiddleware.ts` |
| `src/plugins/` | Plugin interface and lifecycle management. | `Plugin.ts`, `PluginManager.ts` |
| `src/workflows/` | High-level orchestration helpers that compose multiple contract calls. | `TransferWorkflow.ts`, `ListingWorkflow.ts`, `RegistrationWorkflow.ts` |
| `src/utils/` | Pure utility functions: formatting, validation, hashing. | `format.ts`, `validation.ts`, `hash.ts` |
| `tests/helpers/` | Test infrastructure: Anvil process manager, wallet fixtures, contract deployment. | `anvil.ts`, `wallets.ts`, `deploy.ts` |
| `tests/unit/` | Unit tests with mocked providers and contracts. | Mirrors `src/` structure |
| `tests/integration/` | Integration tests against real contracts on Anvil. | `FullProtocolFlow.test.ts` |

---

## ABI Generation

The `abi/` directory is generated from the TransferChain-Contracts repository build output.

### Source of Truth

The smart contracts repository (`TransferChain-Contracts/`) is the single source of truth for ABIs. The SDK never maintains duplicate ABI files.

### Generation Process

```bash
# From the TransferChain-SDK directory
pnpm abi:sync
```

This runs `scripts/sync-abis.ts` which:

1. Reads compiled artifacts from `TransferChain-Contracts/out/**/*.json`
2. Extracts the `abi` field from each artifact
3. Writes clean ABI JSON to `abi/<ContractName>.json`

### Build-Time Inlining

tsup inlines ABI JSON files into the bundle at build time. There are no runtime filesystem reads and no runtime dependencies on the `abi/` directory. Consumers receive a self-contained bundle.

---

## Naming Conventions

| Element | Convention | Examples |
|---------|-----------|----------|
| Classes | PascalCase | `TransferChain`, `PlayerRegistryClient` |
| Interfaces | PascalCase, no `I` prefix | `SdkConfig`, `ProtocolHandler` |
| Methods | camelCase | `getPlayer()`, `createListing()` |
| Enums | PascalCase values | `PlayerStatus.Active`, `DepositStatus.Funded` |
| Types | PascalCase | `Player`, `Listing`, `TransactionResult` |
| Constants | SCREAMING_SNAKE_CASE | `REGISTRY_ADMIN_ROLE` |
| Private members | Underscore prefix | `_contractRegistry` |
| Files (classes) | PascalCase | `TransferChain.ts`, `ProviderManager.ts` |
| Files (types) | camelCase | `types.ts`, `events.ts` |
| Files (tests) | PascalCase + `.test.ts` | `PlayerRegistry.test.ts` |

### Import Conventions

```typescript
// Internal imports use relative paths
import { ProviderManager } from "../core/ProviderManager.js";
import type { SdkConfig } from "../types/config.js";

// External imports use bare specifiers
import { ethers } from "ethers";
import { describe, it, expect } from "vitest";
```
