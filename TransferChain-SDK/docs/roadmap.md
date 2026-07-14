# Roadmap

## Table of Contents

- [Phase 1: MVP (v1.0)](#phase-1-mvp-v10)
- [Phase 2: Developer Experience (v1.x)](#phase-2-developer-experience-v1x)
- [Phase 3: Multi-chain (v2.0)](#phase-3-multi-chain-v20)
- [Phase 4: Account Abstraction (v2.x)](#phase-4-account-abstraction-v2x)
- [Phase 5: Ecosystem (v3.0)](#phase-5-ecosystem-v30)
- [Versioning Policy](#versioning-policy)
- [Breaking Change Policy](#breaking-change-policy)
- [Contract Version Coupling](#contract-version-coupling)

---

## Phase 1: MVP (v1.0)

The initial release provides complete coverage of all 8 smart contracts.

| Feature | Status |
|---------|--------|
| Core infrastructure (ProviderManager, SignerManager, ContractRegistry, TransactionManager) | Planned |
| 8 domain clients | Planned |
| Typed event system (live subscriptions + historical queries) | Planned |
| Metadata resolution (IPFS + HTTP) | Planned |
| Error normalization | Planned |
| Workflow helpers (transfer, listing, registration) | Planned |
| Unit tests (90% coverage) | Planned |
| Integration tests (Anvil) | Planned |
| Full documentation | Planned |

**Target:** Any developer can read on-chain state, submit transactions, and resolve metadata using a single dependency.

---

## Phase 2: Developer Experience (v1.x)

Enhancements for application developers.

| Feature | Description |
|---------|-------------|
| React hooks | `@transferchain/react` — `usePlayer()`, `useListing()`, `useEvents()` |
| CLI tool | `@transferchain/cli` — ABI sync, contract deployment, address management |
| Subgraph integration | Graph Protocol indexer for complex historical queries |
| Batch reads | Multicall support for reading multiple contract states in one RPC call |
| Transaction simulation | Preview transaction effects before submission |
| Improved error messages | Human-readable error messages with suggested actions |

---

## Phase 3: Multi-chain (v2.0)

Support for multiple EVM-compatible deployments.

| Feature | Description |
|---------|-------------|
| Cross-chain state queries | Read player/club state across chains |
| Chain switching | Dynamic chain switching without SDK re-instantiation |
| Multi-chain event subscriptions | Subscribe to events across multiple chains |
| Chain-specific deployment manifests | Per-chain contract addresses |
| Bridge awareness | Read cross-chain transfer status |

---

## Phase 4: Account Abstraction (v2.x)

ERC-4337 and sponsored transaction support.

| Feature | Description |
|---------|-------------|
| Smart account signer adapter | Wrap Safe, Biconomy, ZeroDev signers |
| Gas sponsorship middleware | Paymaster integration for gasless transactions |
| Batched transactions | Combine multiple operations into a single UserOp |
| Paymaster configuration | Configure gas sponsorship rules |

---

## Phase 5: Ecosystem (v3.0)

Platform and community extensions.

| Feature | Description |
|---------|-------------|
| Plugin marketplace | Discover and install community plugins |
| Analytics SDK | `@transferchain/analytics` — transfer analytics and reporting |
| Notification SDK | `@transferchain/notifications` — event-driven notifications |
| TypeScript codegen | Auto-generate SDK clients from new contract ABIs |
| Mobile SDK | React Native optimized build |

---

## Versioning Policy

The SDK follows [Semantic Versioning](https://semver.org/) 2.0.0:

| Change Type | Version Bump | Example |
|------------|-------------|---------|
| Breaking API change | MAJOR | v1.0.0 → v2.0.0 |
| New feature (backward-compatible) | MINOR | v1.0.0 → v1.1.0 |
| Bug fix (backward-compatible) | PATCH | v1.0.0 → v1.0.1 |

### Pre-release

- Alpha: `v1.1.0-alpha.1` — unstable, API may change
- Beta: `v1.1.0-beta.1` — feature complete, API stable
- RC: `v1.1.0-rc.1` — release candidate

---

## Breaking Change Policy

1. **Deprecate first.** In a minor release, mark the old API as deprecated with a migration guide
2. **Remove later.** In the next major release, remove the deprecated API
3. **Provide migration tools.** Codemods or migration scripts where feasible

### Public API Contract

The public API consists of:

- All exports from `src/index.ts`
- All public methods on exported classes
- All exported types, interfaces, and enums
- All exported constants

Internal modules (not re-exported through the barrel) may change without notice.

---

## Contract Version Coupling

The SDK version is independent of the smart contract protocol version. The `protocolVersion` field on `TransferChainConfig` is a protocol-level concern.

The SDK is versioned based on its own API stability. Contract upgrades that add new functions or events are handled as SDK minor releases (backward-compatible). Contract upgrades that change function signatures or event structures require SDK major releases.
